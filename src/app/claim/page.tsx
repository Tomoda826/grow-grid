"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import Confetti from "react-confetti";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

/* ------------ helpers ------------ */
const fmt = (dollars: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(dollars);

/* ------------ wizard steps ------------ */
const steps = ["code", "account", "goal"] as const;
type Step = typeof steps[number];

/* ------------ DB types ------------ */
type GiftRow = {
  id: string;
  code: string;
  layout: string;
  starter_amount: number; // cents
  goal_amount: number | null;
  goal_age: number | null;
  claimed: boolean;
  giver_id: string | null;
};

/* ------------ component ------------ */
export default function ClaimGridPage() {
  const router = useRouter();

  /* auth */
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        setLoggedIn(!!data.session);
      });
    } else {
      setLoggedIn(false);
    }
  }, []);

  /* state */
  const [step, setStep] = useState<Step>("code");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [gift, setGift] = useState<GiftRow | null>(null);

  const [dob, setDob] = useState("");
  const [targetAge, setTargetAge] = useState("18");
  const [goalAmount, setGoalAmount] = useState("0"); // dollars
  const [giverName, setGiverName] = useState("");

  const [code, setCode] = useState("");

  const [acct, setAcct] = useState({
    name: "",
    dob: "",
    email: "",
    password: "",
  });

  /* --- fetch giver's profile name --- */
  async function fetchGiverName(uid: string | null) {
    if (!uid || !supabase) return setGiverName("Someone");
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", uid)
      .maybeSingle();
    setGiverName(data?.full_name || "Someone");
  }

  /* --- code validation --- */
  async function handleValidateCode() {
    if (!code) return setError("Please enter your gift code.");
    if (!supabase) return setError("Database not configured. Please contact support.");
    setLoading(true);

    const { data, error } = await supabase
      .from("gifts")
      .select(
        "id, code, layout, starter_amount, goal_amount, goal_age, claimed, giver_id"
      )
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();
    setLoading(false);

    if (error || !data) return setError("Gift code not found.");
    if (data.claimed) return setError("This code has already been claimed.");

    setGift(data as GiftRow);
    setGoalAmount(String((data.goal_amount ?? data.starter_amount) / 100));
    setTargetAge(String(data.goal_age ?? 18));
    fetchGiverName(data.giver_id);

    setStep(loggedIn ? "goal" : "account");
  }

  /* --- account creation --- */
  async function handleCreateAccount() {
    if (!acct.email || !acct.password || !acct.name)
      return setError("All account fields are required.");
    if (!supabase) return setError("Database not configured. Please contact support.");

    setLoading(true);
    const { error: signErr } = await supabase.auth.signUp({
      email: acct.email,
      password: acct.password,
      options: { data: { full_name: acct.name, dob: acct.dob } },
    });
    if (signErr) {
      setLoading(false);
      return setError(signErr.message);
    }

    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: acct.email,
      password: acct.password,
    });
    setLoading(false);
    if (loginErr) return setError(loginErr.message);

    setLoggedIn(true);
    setStep("goal");
  }

  /* --- finalize → success page --- */
  async function handleFinalizeGoal() {
    if (!gift || !supabase) return;
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user!.id;

    /* insert grid */
    const { data: gridInsert, error: gridErr } = await supabase
      .from("grids")
      .insert([
        {
          user_id: uid,
          layout: gift.layout,
          goal_amount: Number(goalAmount) * 100,
          goal_age: Number(targetAge),
          current_balance: gift.starter_amount,
        },
      ])
      .select("id")
      .single();
    if (gridErr) {
      setLoading(false);
      return setError(gridErr.message);
    }

    /* mark gift claimed */
    const { error: claimErr } = await supabase
      .from("gifts")
      .update({
        claimed: true,
        claimed_by: uid,
        claimed_at: new Date(),
      })
      .eq("id", gift.id);
    if (claimErr) {
      setLoading(false);
      return setError(claimErr.message);
    }

    /* record initial gift as a transaction */
    await supabase.from("transactions").insert([
      {
        grid_id: gridInsert.id,
        amount_cents: gift.starter_amount,
        type: "gift",
        source_gift: gift.id,
      },
    ]);

    /* build success-page query string */
    const starterDollars = gift.starter_amount / 100;
    const pinValue = Number(goalAmount) / 1000;
    const pinsEarned = Math.floor(starterDollars / pinValue);

    const today = new Date();
    const dobDate = new Date(dob);
    const currentAge = Math.floor(
      (today.getTime() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    );
    const horizon = Number(targetAge) - currentAge;
    const fv =
      horizon > 0 ? Math.round(starterDollars * Math.pow(1.06, horizon)) : starterDollars;
    const interestPins = Math.floor((fv - starterDollars) / pinValue);

    const qs = new URLSearchParams({
      code: gift.code,                          // 👈 gift code param
      giver: giverName,
      amount: starterDollars.toString(),
      fv: fv.toString(),
      pinValue: pinValue.toFixed(2),
      pinsEarned: pinsEarned.toString(),
      interestPins: interestPins.toString(),
      goalAmount: goalAmount,
    });

    setLoading(false);
    router.push(`/claim/success?${qs.toString()}`);
  }

  /* ---------- live preview values for goal step ---------- */
  const starter = gift ? gift.starter_amount / 100 : 0;
  const pinValuePrev = Number(goalAmount) > 0 ? Number(goalAmount) / 1000 : 0;
  const pinsEarnedPrev =
    pinValuePrev > 0 ? Math.floor(starter / pinValuePrev) : 0;

  const today = new Date();
  const dobDate = dob ? new Date(dob) : null;
  const currentAge =
    dobDate && !isNaN(dobDate.getTime())
      ? Math.floor(
          (today.getTime() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
        )
      : null;
  const horizon = currentAge !== null ? Number(targetAge) - currentAge : null;
  const fvPrev =
    horizon && horizon > 0
      ? Math.round(starter * Math.pow(1.06, horizon))
      : null;
  const interestPinsPrev =
    fvPrev && pinValuePrev
      ? Math.floor((fvPrev - starter) / pinValuePrev)
      : null;

  /* ------------ UI bodies ------------ */
  let body: React.ReactElement | null = null;

  /* STEP 0 – Code */
  if (step === "code") {
    body = (
      <div className="relative flex flex-col items-center gap-6">
        <h2 className="text-2xl font-bold text-center leading-tight">
          You’ve Been Gifted a&nbsp;Grow&nbsp;Grid! 🎁
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          {giverName
            ? `${giverName} invested in your future.`
            : "A special someone invested in your future."}
          <br />
          Enter the code from your card to unlock your first pins!
        </p>
        <Input
          placeholder="ABCD-1234"
          className="text-center text-lg tracking-widest"
          value={code}
          maxLength={9}
          onChange={(e) => {
            const input = e.target.value;
            
            // Remove any existing dashes and non-alphanumeric characters, convert to uppercase
            let clean = input.replace(/[^A-Z0-9]/gi, '').toUpperCase();
            
            // Limit to 8 alphanumeric characters
            if (clean.length > 8) {
              clean = clean.substring(0, 8);
            }
            
            // Auto-format with dash after 4th character
            let formatted = clean;
            if (clean.length > 4) {
              formatted = clean.substring(0, 4) + '-' + clean.substring(4);
            }
            
            setCode(formatted);
          }}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          className="w-full"
          onClick={handleValidateCode}
          disabled={loading || !code}
        >
          {loading ? "Checking…" : "Unlock My Grid"}
        </Button>
      </div>
    );
  }

  /* STEP 1 – Account */
  if (step === "account") {
    body = (
      <div className="space-y-6 text-center">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Let’s set up your account</h2>
          <p className="text-sm text-muted-foreground">
            A parent or guardian should fill this part out. <br />
            Once you’re in, you’ll see{" "}
            <strong>{giverName || "who sent your Grow Grid!"}</strong>
          </p>
        </div>
        <div className="space-y-4 text-left">
          <Input
            placeholder="Full Name"
            value={acct.name}
            onChange={(e) => setAcct({ ...acct, name: e.target.value })}
          />
          <Input
            type="date"
            value={acct.dob}
            onChange={(e) => setAcct({ ...acct, dob: e.target.value })}
          />
          <Input
            type="email"
            placeholder="Parent Email"
            value={acct.email}
            onChange={(e) => setAcct({ ...acct, email: e.target.value })}
          />
          <Input
            type="password"
            placeholder="Create Password"
            value={acct.password}
            onChange={(e) => setAcct({ ...acct, password: e.target.value })}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          className="w-full"
          onClick={handleCreateAccount}
          disabled={loading || !acct.email || !acct.password || !acct.name}
        >
          {loading ? "Creating…" : "Create Account & Continue"}
        </Button>
      </div>
    );
  }

  /* STEP 2 – Goal */
  if (step === "goal" && gift) {
    body = (
      <div className="space-y-6">
        <div className="space-y-2 text-sm">
          <p>
            <strong>{giverName || "Someone"}</strong> sent you{" "}
            <strong>{fmt(starter)}</strong> to kick-start your Grid!
          </p>
          <p className="text-muted-foreground">
            Tell us your child’s birthday and when they’ll use the money.
            We’ll calculate how much each pin is worth and how big this gift may
            grow.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Child’s Birthday</label>
            <Input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-1">
              Target Age{" "}
              <span
                title="We recommend 20–25 years to maximise compound growth."
                className="cursor-help text-muted-foreground"
              >
                ⓘ
              </span>
            </label>
            <Input
              type="number"
              min="5"
              max="40"
              placeholder="e.g. 25"
              value={targetAge}
              onChange={(e) => setTargetAge(e.target.value)}
            />
          </div>
        </div>

        {/* Goal amount */}
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">
            Set an overall <em>goal investment amount</em>. We divide this into
            1,000 pins so you can track progress visually.
          </p>
          <div>
            <label className="text-sm font-medium">Goal Amount (USD)</label>
            <Input
              type="number"
              min="1"
              placeholder="e.g. 10000"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Live preview */}
        {pinValuePrev > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-4 text-center">
              <PreviewBox
                label="Each Pin Worth"
                value={fmt(pinValuePrev)}
              />
              <PreviewBox
                label="Pins Earned Today"
                value={pinsEarnedPrev.toString()}
              />
              {interestPinsPrev !== null && (
                <PreviewBox
                  label="Interest Pins*"
                  value={interestPinsPrev.toString()}
                />
              )}
              {fvPrev && fvPrev > starter && (
                <PreviewBox
                  label="Could Grow To*"
                  value={fmt(fvPrev)}
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              *Based on 6 % average annual return. Try tweaking the target age!
            </p>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          onClick={handleFinalizeGoal}
          disabled={
            loading ||
            !dob ||
            !targetAge ||
            Number(goalAmount) <= 0
          }
        >
          {loading ? "Saving…" : "Next"}
        </Button>
      </div>
    );
  }

  /* ---------- render ---------- */
  const progress = ((steps.indexOf(step) + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-lg shadow-sm">
        <CardHeader>
          <CardTitle>
            Claim Your Grow Grid – Step {steps.indexOf(step) + 1} of{" "}
            {steps.length}
          </CardTitle>
        </CardHeader>
        <Progress value={progress} className="mx-6" />
        <CardContent className="space-y-6 py-8">{body}</CardContent>
      </Card>
    </div>
  );
}

/* small helper for preview boxes */
function PreviewBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
