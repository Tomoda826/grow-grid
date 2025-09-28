"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";   // ← NEW import

/* ---------- local types ---------- */
type NotifyKey = "deposits" | "goals" | "promos";
type NotifyState = Record<NotifyKey, boolean>;

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  const [notify, setNotify] = useState<NotifyState>({
    deposits: true,
    goals: true,
    promos: false,
  });

  /* -------- fetch user on mount -------- */
  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        router.replace("/login?next=/profile");
        return;
      }

      setProfile({
        full_name: (user.user_metadata?.full_name as string) || "",
        email: user.email || "",
        phone: (user.user_metadata?.phone as string) || "",
      });

      setNotify({
        deposits: user.user_metadata?.notify_deposits !== false,
        goals: user.user_metadata?.notify_goals !== false,
        promos: user.user_metadata?.notify_promos === true,
      });

      setLoading(false);
    })();
  }, [router]);

  /* -------- helpers -------- */
  const updateField = (key: keyof typeof profile, val: string) =>
    setProfile({ ...profile, [key]: val });

  const saveProfile = async () => {
    if (!supabase) return;
    setSaving(true);
    setError("");

    const { error: supaErr } = await supabase.auth.updateUser({
      email: profile.email,
      data: {
        full_name: profile.full_name,
        phone: profile.phone,
        notify_deposits: notify.deposits,
        notify_goals: notify.goals,
        notify_promos: notify.promos,
      },
    });

    setSaving(false);
    if (supaErr) setError(supaErr.message);
  };

  /* -------- loading state with Skeletons -------- */
  if (loading)
    return (
      <div className="container mx-auto p-8 space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-56 w-full" />
      </div>
    );

  /* -------- actual profile page -------- */
  return (
    <div className="container mx-auto p-8 space-y-10">
      {/* PERSONAL INFO CARD */}
      <Card className="max-w-3xl mx-auto shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={profile.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={profile.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={saveProfile} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* NOTIFICATIONS CARD */}
      <Card className="max-w-3xl mx-auto shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              { key: "deposits", label: "Deposits & drafts" },
              { key: "goals", label: "Goal milestones" },
              { key: "promos", label: "Promotions & tips" },
            ] as { key: NotifyKey; label: string }[]
          ).map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <span>{item.label}</span>
              <Switch
                checked={notify[item.key]}
                onCheckedChange={(val: boolean) =>
                  setNotify({ ...notify, [item.key]: val })
                }
              />
            </div>
          ))}

          <Button onClick={saveProfile} disabled={saving}>
            {saving ? "Saving…" : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
