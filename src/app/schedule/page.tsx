"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

/* ──────────────── local types ──────────────── */
interface ScheduleRow {
  id: string;
  grid_id: string;
  user_id: string;            // ✅ string, not uid
  amount_cents: number;
  frequency: "Monthly" | "Quarterly" | "Twice a Year" | "Yearly";
  draft_day: number;          // 1-28
  funding_method: string;     // masked label
  status: "Active" | "Paused" | "Deleted";
  next_run: string | null;
}

interface GridRow {
  id: string;
  user_id: string;
  created_at: string;
  current_balance: number;
  goal_amount: number | null;
  goal_age: number | null;
}

interface Txn {
  amount_cents: number;
  invested_at: string;
}

interface Schedule {
  id?: string;
  amount_cents: number;
  frequency: "Monthly" | "Quarterly" | "Twice a Year" | "Yearly";
  status: string;
}

/* ──────────────── helpers ──────────────── */
const ANNUAL = 0.06; // 6% annual return (matching dashboard)

const monthlyEq = (s: Schedule) =>
  s.frequency === "Monthly"
    ? s.amount_cents / 100
    : s.frequency === "Quarterly"
    ? s.amount_cents / 100 / 3
    : s.frequency === "Twice a Year"
    ? s.amount_cents / 100 / 6
    : s.amount_cents / 100 / 12;

const freqOptions = [
  { label: "Monthly", value: "Monthly" },
  { label: "Quarterly", value: "Quarterly" },
  { label: "Twice a Year", value: "Twice a Year" },
  { label: "Yearly", value: "Yearly" },
] as const;

type Freq = typeof freqOptions[number]["value"];

const fundingOptions = [
  { value: "card1", label: "Visa ••••1234" },
  { value: "bank1", label: "BoA Checking •••123" },
] as const;

function fmt(d: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(d);
}

/* quick helper to compute next_run */
function nextRunISO(draftDay: number): string {
  const today = new Date();
  const yr = today.getFullYear();
  const mo = today.getMonth();
  const firstRun =
    today.getDate() <= draftDay
      ? new Date(yr, mo, draftDay)
      : new Date(yr, mo + 1, draftDay);
  return firstRun.toISOString();
}

/* ──────────────── component ──────────────── */
export default function ManageSchedulePage() {
  const router = useRouter();

  const [grid, setGrid] = useState<GridRow | null>(null);
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    amount: "",
    freq: "Monthly" as Freq,
    draftDay: "",
    method: "card1",
  });

  /* ---------- fetch on mount ---------- */
  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      if (!uid) {
        router.replace("/login?next=/schedule");
        return;
      }

      /* user’s grid */
      const { data: g } = await supabase
        .from("grids")
        .select("id, user_id, created_at, current_balance, goal_amount, goal_age")
        .eq("user_id", uid)
        .limit(1)
        .single<GridRow>();

      setGrid(g);

      if (g) {
        const [{ data: scheds }, { data: t }, { data: s }] = await Promise.all([
          supabase
            .from("schedules")
            .select(
              "id, grid_id, user_id, amount_cents, frequency, draft_day, funding_method, status, next_run"
            )
            .eq("grid_id", g.id)
            .neq("status", "Deleted")
            .order("next_run")
            .returns<ScheduleRow[]>(),
          supabase
            .from("transactions")
            .select("amount_cents, invested_at")
            .eq("grid_id", g.id)
            .returns<Txn[]>(),
          supabase
            .from("schedules")
            .select("id, amount_cents, frequency, status")
            .eq("grid_id", g.id)
            .eq("status", "Active")
            .returns<Schedule[]>(),
        ]);

        setRows(scheds ?? []);
        setTxns(t ?? []);
        setSchedules(s ?? []);
      }

      setLoading(false);
    })();
  }, [router]);

  /* ---------- calculations ---------- */
  const calc = useMemo(() => {
    if (!grid) return null;

    /* Initial dollars invested via gift + manual txns */
    const principal =
      txns.reduce((sum, t) => sum + t.amount_cents / 100, 0) ||
      grid.current_balance / 100;

    /* Elapsed time since grid creation */
    const elapsedYears =
      (Date.now() - new Date(grid.created_at).getTime()) / 3.15576e10;

    /* Schedule contributions monthly equivalent */
    const schedMo = schedules.reduce((sum, s) => sum + monthlyEq(s), 0);
    const scheduleSoFar = schedMo * (elapsedYears * 12);

    /* Real dollars invested to date */
    const investedSoFar = principal + scheduleSoFar;

    /* Goal calculations */
    const years = grid.goal_age ?? 18;
    const goalUSD = (grid.goal_amount ?? 0) / 100;

    /* Calculate monthly need using same logic as dashboard */
    let invested = principal;
    let balance = principal;

    for (let y = 0; y <= years; y++) {
      if (y > 0) {
        invested += schedMo * 12;
        balance += schedMo * 12;
      }
      if (y > 0 || years === 0) balance *= 1 + ANNUAL;
    }

    const remaining = Math.max(goalUSD - balance, 0);
    const r = ANNUAL / 12;
    const N = years * 12;
    const rawPMT =
      remaining > 0 ? (remaining * r) / (Math.pow(1 + r, N) - 1) : 0;
    const monthlyNeed = Math.max(Math.ceil(rawPMT - schedMo), 0);

    return {
      schedMo,
      monthlyNeed,
      goalUSD,
      years,
      investedSoFar,
    };
  }, [grid, txns, schedules]);

  /* ---------- actions ---------- */
  const saveNewSchedule = async () => {
    if (!grid || !supabase) return;
    setErr("");

    const amt = Number(form.amount);
    const day = Number(form.draftDay);
    if (isNaN(amt) || amt <= 0 || isNaN(day) || day < 1 || day > 28) {
      setErr("Enter a valid amount and draft day (1-28).");
      return;
    }

    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user.id;
    if (!uid) {
      setErr("Session expired. Please log in again.");
      return;
    }

    const { data, error } = await supabase
      .from("schedules")
      .insert([
        {
          grid_id: grid.id,
          user_id: uid,                           // ✅ include user_id
          amount_cents: amt * 100,
          frequency: form.freq,
          draft_day: day,
          funding_method: fundingOptions.find((f) => f.value === form.method)!.label,
          status: "Active",
          next_run: nextRunISO(day),              // ✅ satisfies NOT NULL
        },
      ])
      .select(
        "id, grid_id, user_id, amount_cents, frequency, draft_day, funding_method, status, next_run"
      )
      .single<ScheduleRow>();

    if (error) {
      setErr(error.message);
      return;
    }

    if (data) {
      setRows([...rows, data]);
      // Update schedules state for banner calculation
      if (data.status === "Active") {
        setSchedules(prev => [...prev, {
          id: data.id,
          amount_cents: data.amount_cents,
          frequency: data.frequency,
          status: data.status
        }]);
      }
    }
    setIsAdding(false);
    setForm({ amount: "", freq: "Monthly", draftDay: "", method: "card1" });
  };

  const toggleActive = async (row: ScheduleRow, val: boolean) => {
    if (!supabase) return;
    await supabase
      .from("schedules")
      .update({ status: val ? "Active" : "Paused" })
      .eq("id", row.id);
    setRows(
      rows.map((r) =>
        r.id === row.id ? { ...r, status: val ? "Active" : "Paused" } : r
      )
    );
    // Update schedules state for banner calculation
    if (val) {
      // Add to active schedules (reactivating)
      setSchedules(prev => [...prev, {
        id: row.id,
        amount_cents: row.amount_cents,
        frequency: row.frequency,
        status: "Active"
      }]);
    } else {
      // Remove from active schedules (pausing)
      setSchedules(prev => prev.filter(s => s.id !== row.id));
    }
  };

  const removeRow = async (row: ScheduleRow) => {
    if (!supabase) return;
    await supabase
      .from("schedules")
      .update({ status: "Deleted" })
      .eq("id", row.id);
    setRows(rows.filter((r) => r.id !== row.id));
    // Update schedules state for banner calculation
    if (row.status === "Active") {
      setSchedules(prev => prev.filter(s => s.id !== row.id));
    }
  };

  /* ---------- UI ---------- */
  if (loading) return <Centered>Loading…</Centered>;

  return (
    <div className="min-h-screen flex flex-col bg-muted/50">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <h1 className="text-lg font-semibold tracking-tight">
            Grow Grid – Manage Schedule
          </h1>
          <Button variant="secondary" size="sm" onClick={() => router.back()}>
            ← Back to Dashboard
          </Button>
        </div>
      </header>

      {/* CONTENT */}
      <main className="container mx-auto flex-1 p-4 space-y-6">
        
        {/* Monthly Investment Goal Banner */}
        {calc && calc.monthlyNeed > 0 && (
          <Card className="border-l-4 border-primary shadow-sm">
            <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">🎯 Investment Goal</p>
                <p className="text-sm text-muted-foreground">
                  Invest <strong>{fmt(calc.monthlyNeed)}</strong>/mo to reach{" "}
                  {fmt(calc.goalUSD)} by age {calc.years}.
                </p>
                {calc.schedMo > 0 && (
                  <p className="text-xs text-muted-foreground">
                    You already invest {fmt(calc.schedMo)}/mo automatically.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Your Investment Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground mb-4">
                You do not have any recurring investments yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Draft Day</TableHead>
                    <TableHead>Funding Method</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{fmt(r.amount_cents / 100)}</TableCell>
                      <TableCell>{r.frequency}</TableCell>
                      <TableCell>{r.draft_day}</TableCell>
                      <TableCell>{r.funding_method}</TableCell>
                      <TableCell>
                        <Switch
                          checked={r.status === "Active"}
                          onCheckedChange={(val) => toggleActive(r, val)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeRow(r)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!isAdding && (
              <Button className="mt-4" onClick={() => setIsAdding(true)}>
                + Add Schedule
              </Button>
            )}
          </CardContent>
        </Card>

        {isAdding && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Add New Schedule</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Amount (USD)</label>
                <Input
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Frequency</label>
                <Select
                  value={form.freq}
                  onValueChange={(val) =>
                    setForm({ ...form, freq: val as Freq })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {freqOptions.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Draft Day (1-28)</label>
                <Input
                  type="number"
                  min="1"
                  max="28"
                  value={form.draftDay}
                  onChange={(e) =>
                    setForm({ ...form, draftDay: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Funding Method</label>
                <Select
                  value={form.method}
                  onValueChange={(val) => setForm({ ...form, method: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fundingOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {err && (
                <p className="text-sm text-destructive md:col-span-2 lg:col-span-3">
                  {err}
                </p>
              )}
              <div className="md:col-span-2 lg:col-span-3 flex gap-4 mt-2">
                <Button onClick={saveNewSchedule}>Save Schedule</Button>
                <Button variant="ghost" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="py-4 border-t text-center text-sm text-muted-foreground">
        © Grow Grid 2025
      </footer>
    </div>
  );
}

/* ---------- small util ---------- */
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      {children}
    </div>
  );
}
