"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabaseClient";

// import PinBoard from "@/components/PinBoard"; // <- still commented out

/* ------------------------------------------------------------------ */
/* Types that match your table rows                                    */
/* ------------------------------------------------------------------ */

interface Grid {
  id: string;
  user_id: string;
  created_at: string;
  current_balance: number; // cents
  goal_amount: number;     // cents
  goal_age: number | null;
}

interface Txn {
  amount_cents: number;
  invested_at: string;
}

interface Schedule {
  amount_cents: number;
  frequency: "Monthly" | "Quarterly" | "Twice a Year" | "Yearly";
  status: "Active" | "Paused";
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);

const ANNUAL = 0.06;
const monthlyEq = (s: Schedule) =>
  s.frequency === "Monthly"
    ? s.amount_cents / 100
    : s.frequency === "Quarterly"
    ? s.amount_cents / 100 / 3
    : s.frequency === "Twice a Year"
    ? s.amount_cents / 100 / 6
    : s.amount_cents / 100 / 12;

/* ------------------------------------------------------------------ */
/* Page wrapper to enforce auth                                        */
/* ------------------------------------------------------------------ */

export default function DashboardRoute() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}

/* ------------------------------------------------------------------ */
/* Main dashboard component                                            */
/* ------------------------------------------------------------------ */

function Dashboard() {
  const router = useRouter();

  const [grid, setGrid] = useState<Grid | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  /* one-time contribution form */
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("card1");

  /* ---------------- Fetch once on mount ---------------- */
  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const uid = (await supabase.auth.getSession()).data.session?.user.id;
      if (!uid) return;

      const { data: g } = await supabase
        .from("grids")
        .select(
          "id, user_id, created_at, current_balance, goal_amount, goal_age"
        )
        .eq("user_id", uid)
        .single<Grid>();

      if (!g) {
        setLoading(false);
        return;
      }

      const [{ data: t }, { data: s }] = await Promise.all([
        supabase
          .from("transactions")
          .select("amount_cents, invested_at")
          .eq("grid_id", g.id)
          .returns<Txn[]>(),
        supabase
          .from("schedules")
          .select("amount_cents, frequency, status")
          .eq("grid_id", g.id)
          .eq("status", "Active")
          .returns<Schedule[]>(),
      ]);

      setGrid(g);
      setTxns(t ?? []);
      setSchedules(s ?? []);
      setLoading(false);
    })();
  }, []);

  /* ---------------- Core calculations ---------------- */
  const calc = useMemo(() => {
    if (!grid) return null;

    /* Initial dollars invested via gift + manual txns */
    const principal =
      txns.reduce((sum, t) => sum + t.amount_cents / 100, 0) ||
      grid.current_balance / 100;

    /* Elapsed time since grid creation */
    const elapsedYears =
      (Date.now() - new Date(grid.created_at).getTime()) / 3.15576e10;
    const elapsedMonths = elapsedYears * 12;

    /* Schedule contributions that have *actually* happened */
    const schedMo = schedules.reduce((sum, s) => sum + monthlyEq(s), 0);
    const scheduleSoFar = schedMo * elapsedMonths;

    /* NEW – real dollars invested to date */
    const investedSoFar = principal + scheduleSoFar;

    /* Interest earned to date */
    const interestNow =
      investedSoFar *
      (Math.pow(1 + ANNUAL, Math.max(0, elapsedYears)) - 1);

    /* Chart projection (unchanged from before) */
    const schedYr = schedMo * 12;
    const years = grid.goal_age ?? 18;
    const goalUSD = grid.goal_amount / 100;

    let invested = principal;
    let balance = principal;
    const rows: {
      year: number;
      invested: number;
      interest: number;
      total: number;
      goal: number;
    }[] = [];

    for (let y = 0; y <= years; y++) {
      if (y > 0) {
        invested += schedYr;
        balance += schedYr;
      }
      if (y > 0 || years === 0) balance *= 1 + ANNUAL;

      rows.push({
        year: y,
        invested: Math.round(invested),
        interest: Math.round(balance - invested),
        total: Math.round(balance),
        goal: goalUSD,
      });
    }

    const last = rows.at(-1)!;
    const remaining = Math.max(goalUSD - last.total, 0);
    const r = ANNUAL / 12;
    const N = years * 12;
    const rawPMT =
      remaining > 0 ? (remaining * r) / (Math.pow(1 + r, N) - 1) : 0;
    const monthlyNeed = Math.max(Math.ceil(rawPMT - schedMo), 0);

    /* Pin counts (still calculated even if board hidden) */
    const pinValue = goalUSD / 1000 || 1;
    const earnedPins = Math.min(1000, Math.floor(investedSoFar / pinValue));
    const goldRaw = Math.floor(interestNow / pinValue);
    const interestPins = Math.max(
      0,
      Math.min(1000 - earnedPins, goldRaw)
    );

    const yrsDone = Math.floor(elapsedYears);
    const mosDone = Math.floor((elapsedYears % 1) * 12);

    return {
      rows,
      schedMo,
      monthlyNeed,
      balanceNow: investedSoFar, // <-- FIXED VALUE
      interestGoal: last.interest,
      valueAtGoal: last.total,
      investedGoal: last.invested,
      timeInvested: `${yrsDone} yrs ${mosDone} mos`,
      timeUntilGoal: `${years} yrs`,
      goalUSD,
      earnedPins,
      interestPins,
    };
  }, [grid, txns, schedules]);

  /* ---------------- UI states ---------------- */
  if (loading) return <Center>Loading…</Center>;
  if (!grid || !calc) return <Center>No Grow Grid.</Center>;

  /* ---------------- JSX ---------------- */
  return (
    <div className="min-h-screen flex flex-col bg-muted/50">
      <Header />

      {/* Share link */}
<Button
  variant="outline"
  size="sm"
  onClick={() => {
    const url = `${window.location.origin}/gift/${grid.id}`;
    navigator.clipboard.writeText(url);
    alert("Link copied!");
  }}
>
  Copy gift link
</Button>


      <main className="container mx-auto flex-1 p-4 space-y-8">

        {/* Stat Cards --------------------------------------------------- */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Stat label="Time Invested" val={calc.timeInvested} />
          <Stat label="Time Till Goal" val={calc.timeUntilGoal} />
          <Stat label="Estimated Value At Goal" val={fmt(calc.valueAtGoal)} />

          <Stat
            label="Current Actual Investment Value"
            val={fmt(calc.balanceNow)}
          />
          <Stat
            label="Estimated Investment at Goal"
            val={fmt(calc.investedGoal)}
          />
          <Stat
            label="Current Projected Interest"
            val={fmt(calc.interestGoal)}
          />
        </section>

        {/* Pin Board (still commented out) ------------------------------
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Your Grow Grid</h2>
          <PinBoard
            earnedPins={calc.earnedPins}
            interestPins={calc.interestPins}
          />
          <p className="text-xs text-muted-foreground">
            Silver pins = invested dollars • Gold pins = interest earned so far
          </p>
        </section>
        ---------------------------------------------------------------- */}

        {/* CTA banner --------------------------------------------------- */}
        {calc.monthlyNeed > 0 ? (
          <Card className="border-l-4 border-primary shadow-sm">
            <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">🔄 Stay on track!</p>
                <p className="text-sm text-muted-foreground">
                  Invest <strong>{fmt(calc.monthlyNeed)}</strong>/mo to reach{" "}
                  {fmt(calc.goalUSD)} by age {grid.goal_age ?? 18}.
                </p>
                {calc.schedMo > 0 && (
                  <p className="text-xs text-muted-foreground">
                    You already invest {fmt(calc.schedMo)}/mo.
                  </p>
                )}
              </div>
              <Button onClick={() => router.push("/schedule")}>
                Set Up Investment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-l-4 border-green-500 bg-green-50 shadow-sm">
            <CardContent className="p-6 text-sm">
              🎉 Your active schedule ({fmt(calc.schedMo)}/mo) is on pace to hit
              the goal!
            </CardContent>
          </Card>
        )}

        {/* Recurring Schedule Table ------------------------------------ */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recurring Schedule</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/schedule")}
            >
              Manage
            </Button>
          </div>

          {schedules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active recurring investments.
            </p>
          ) : (
            <Card className="shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell>{fmt(s.amount_cents / 100)}</TableCell>
                      <TableCell>{s.frequency}</TableCell>
                      <TableCell>{s.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </section>

        {/* Growth Chart ------------------------------------------------- */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Projected Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calc.rows}>
                <XAxis
                  dataKey="year"
                  label={{ value: "Years", offset: -5, position: "insideBottom" }}
                />
                <YAxis
                  tickFormatter={(v) => `$${v / 1000}K`}
                  domain={[0, 'dataMax']}
                  interval="preserveStartEnd"
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                          <p className="font-medium">{`Year ${label}`}</p>
                          <p className="text-blue-600">{`Principal: ${fmt(data.invested)}`}</p>
                          <p className="text-green-600">{`Interest: ${fmt(data.interest)}`}</p>
                          <p className="text-gray-700">{`Estimated Value: ${fmt(data.total)}`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Line
                  dataKey="invested"
                  name="Principal"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  dataKey="total"
                  name="Interest"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  dataKey="goal"
                  name="Goal"
                  stroke="#eab308"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* One-time contribution --------------------------------------- */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">One-Time Contribution</h2>
          <div className="bg-card p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/4">
              <label className="text-sm font-medium">Amount (USD)</label>
              <Input
                type="number"
                min="1"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="w-full md:w-1/4">
              <label className="text-sm font-medium">Funding Method</label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card1">Visa ••••1234</SelectItem>
                  <SelectItem value="bank1">BoA Checking •••123</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full md:w-auto">Invest Now</Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tiny helpers                                                        */
/* ------------------------------------------------------------------ */

const Header = () => {
  const r = useRouter();
  return (
    <header className="sticky top-0 border-b bg-white/90 backdrop-blur">
      <div className="container mx-auto h-14 px-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Grow Grid Dashboard</h1>
        <Button size="sm" onClick={() => r.push("/claim")}>
          Claim New Gift
        </Button>
      </div>
    </header>
  );
};

const Stat = ({ label, val }: { label: string; val: string }) => (
  <Card className="shadow-sm">
    <CardHeader>
      <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-semibold">{val}</p>
    </CardContent>
  </Card>
);

const Center = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex items-center justify-center">
    {children}
  </div>
);

const Footer = () => (
  <footer className="py-6 border-t text-center text-sm text-muted-foreground">
    © Grow Grid 2025
  </footer>
);
