"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

/* ---------- helper: generate 4-4 code ---------- */
function generateCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const chunk = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join("");
  return `${chunk()}-${chunk()}`;
}

/* ---------- wizard steps ---------- */
const steps = [
  "giver",
  "recipientAge",
  "timeline",
  "amount",
  "message",
  "layout",
  "account",
  "review",
] as const;
type Step = typeof steps[number];

/* ---------- component ---------- */
export default function GiftWizard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  /* check login state on mount */
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState<boolean | null>(null);
  useEffect(() => {
    // If supabase is not configured, set to false
    if (!supabase) {
      setAlreadyLoggedIn(false);
      return;
    }
    
    supabase.auth.getSession().then(({ data }) => {
      setAlreadyLoggedIn(!!data.session);
    });
  }, []);

  /* form state */
  const [form, setForm] = useState({
    giver: "",
    recipientAge: "",
    timelineAge: "",
    amount: "",
    message: "",
    layout: "portrait",
    email: "",
    password: "",
  });

  /* ui state */
  const [step, setStep] = useState<Step>("giver");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* auto-focus input when step changes */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === 'message' && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      } else if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [step]);

  const update = (k: keyof typeof form, v: string) =>
    setForm({ ...form, [k]: v });

  /* handle enter key press */
  const handleKeyDown = (e: React.KeyboardEvent, nextAction: () => void, canProceed: boolean) => {
    if (e.key === 'Enter' && canProceed) {
      e.preventDefault();
      nextAction();
    }
  };

  /* ---------- place order (insert gift) ---------- */
  async function placeOrder() {
    setError("");
    setSaving(true);

    // Check if supabase is configured
    if (!supabase) {
      setError("Database not configured. Please contact support.");
      setSaving(false);
      return;
    }

    /* 1. unique code */
    let code = generateCode();
    while (true) {
      const { data } = await supabase
        .from("gifts")
        .select("id")
        .eq("code", code)
        .maybeSingle();
      if (!data) break;
      code = generateCode();
    }

    /* 2. giver id */
    const { data: userData } = await supabase.auth.getUser();
    const giverId = userData.user!.id; // logged-in guaranteed by previous step

    /* 3. insert */
    const { error: dbErr } = await supabase.from("gifts").insert([
      {
        code,
        giver_id: giverId,
        layout: form.layout,
        starter_amount: Number(form.amount) * 100,
        goal_amount: 0, // placeholder if you track goals separately
        goal_age: Number(form.timelineAge || "0"),
        recipient_name: `Age ${form.recipientAge}`,
      },
    ]);

    setSaving(false);

    if (dbErr) {
      setError(dbErr.message);
      return;
    }

    /* 4. redirect */
    router.push(`/order_success?code=${code}`);
  }

  /* ---------- per-step body ---------- */
  let body: React.ReactElement | null = null;

  switch (step) {
    case "giver":
      body = (
        <>
          <label className="text-sm font-medium">Your Name</label>
          <Input
            ref={inputRef}
            placeholder="e.g. Grandpa Jim"
            value={form.giver}
            onChange={(e) => update("giver", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, () => setStep("recipientAge"), !!form.giver)}
          />
          <Button
            className="mt-4"
            onClick={() => setStep("recipientAge")}
            disabled={!form.giver}
          >
            Next
          </Button>
        </>
      );
      break;

    case "recipientAge":
      body = (
        <>
          <label className="text-sm font-medium">
            How old is the recipient?
          </label>
          <Input
            ref={inputRef}
            type="number"
            min="0"
            max="17"
            placeholder="e.g. 4"
            value={form.recipientAge}
            onChange={(e) => update("recipientAge", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, () => setStep("timeline"), !!form.recipientAge)}
          />
          <Button
            className="mt-4"
            onClick={() => setStep("timeline")}
            disabled={!form.recipientAge}
          >
            Next
          </Button>
        </>
      );
      break;

    case "timeline":
      body = (
        <>
          <label className="text-sm font-medium">
            At what age will they use the gift?
          </label>
          <Input
            ref={inputRef}
            type="number"
            min="5"
            max="25"
            placeholder="18"
            value={form.timelineAge}
            onChange={(e) => update("timelineAge", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, () => setStep("amount"), !!form.timelineAge)}
          />
          <Button
            className="mt-4"
            onClick={() => setStep("amount")}
            disabled={!form.timelineAge}
          >
            Next
          </Button>
        </>
      );
      break;

    case "amount":
      // Format display value as currency
      const formatCurrency = (value: string) => {
        if (!value) return "";
        const num = parseFloat(value.replace(/[^0-9.]/g, ""));
        if (isNaN(num)) return "";
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(num);
      };

      const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^0-9.]/g, "");
        update("amount", rawValue);
      };

      body = (
        <>
          <label className="text-sm font-medium">Kick-start Amount (USD)</label>
          <Input
            ref={inputRef}
            type="text"
            placeholder="$100"
            value={form.amount ? formatCurrency(form.amount) : ""}
            onChange={handleAmountChange}
            onKeyDown={(e) => handleKeyDown(e, () => setStep("message"), !!form.amount)}
          />
          <Button
            className="mt-4"
            onClick={() => setStep("message")}
            disabled={!form.amount}
          >
            Next
          </Button>
        </>
      );
      break;

    case "message":
      body = (
        <>
          <label className="text-sm font-medium">Personal Message</label>
          <textarea
            ref={textareaRef}
            className="w-full h-24 rounded-md border p-2"
            placeholder="Happy Birthday! Can't wait to see your grid fill up!"
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey && form.message) {
                e.preventDefault();
                setStep("layout");
              }
            }}
          />
          <Button
            className="mt-4"
            onClick={() => setStep("layout")}
            disabled={!form.message}
          >
            Next
          </Button>
          <p className="text-xs text-muted-foreground mt-1">Press Ctrl+Enter to continue</p>
        </>
      );
      break;

    case "layout":
      body = (
        <>
          <label className="text-sm font-medium">Choose Board Layout</label>
          <Select
            value={form.layout}
            onValueChange={(v) => update("layout", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="portrait">Portrait</SelectItem>
              <SelectItem value="landscape">Landscape</SelectItem>
              <SelectItem value="circular">Circular</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="mt-4"
            onClick={() =>
              setStep(
                alreadyLoggedIn === true ? "review" : "account"
              )
            }
          >
            Next
          </Button>
        </>
      );
      break;

    case "account":
      const handleAccountSubmit = async () => {
        setError("");
        
        // Check if supabase is configured
        if (!supabase) {
          setError("Authentication not configured. Please contact support.");
          return;
        }
        
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.giver } },
        });
        if (error) {
          setError(error.message);
          return;
        }
        const { error: signErr } =
          await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
          });
        if (signErr) {
          setError(signErr.message);
          return;
        }
        setStep("review");
      };
      
      body = (
        <>
          <label className="text-sm font-medium">Email</label>
          <Input
            ref={inputRef}
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && form.email) {
                e.preventDefault();
                passwordRef.current?.focus();
              }
            }}
          />
          <label className="text-sm font-medium">Password</label>
          <Input
            ref={passwordRef}
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleAccountSubmit, !!(form.email && form.password))}
          />

          {error && <p className="text-destructive">{error}</p>}

          <Button
            className="mt-4"
            onClick={handleAccountSubmit}
            disabled={!form.email || !form.password}
          >
            Create Account
          </Button>
        </>
      );
      break;

    case "review":
      body = (
        <div className="space-y-4 text-sm">
          <h3 className="font-semibold">Review Order</h3>
          <ul className="space-y-1">
            <li>
              <strong>Giver:</strong> {form.giver}
            </li>
            <li>
              <strong>Recipient Age:</strong> {form.recipientAge}
            </li>
            <li>
              <strong>Use at Age:</strong> {form.timelineAge}
            </li>
            <li>
              <strong>Amount:</strong> ${form.amount}
            </li>
            <li>
              <strong>Layout:</strong> {form.layout}
            </li>
            <li>
              <strong>Message:</strong> {form.message}
            </li>
          </ul>

          {error && <p className="text-destructive">{error}</p>}

          <Button
            className="w-full"
            onClick={placeOrder}
            disabled={saving}
          >
            {saving ? "Placing…" : "Place Order"}
          </Button>
        </div>
      );
      break;
  }

  const progress = ((steps.indexOf(step) + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-muted/50 py-10 px-4">
      <Card className="w-full max-w-xl mx-auto shadow-sm">
        <CardHeader>
          <CardTitle>
            Step {steps.indexOf(step) + 1} of {steps.length}
          </CardTitle>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent className="space-y-6 py-8">{body}</CardContent>
      </Card>
    </div>
  );
}
