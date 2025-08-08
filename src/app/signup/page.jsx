"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  // form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    agree: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key, val) => setForm({ ...form, [key]: val });

  const submit = async () => {
    setError("");

    if (!form.name || !form.email || !form.password || !form.confirm) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!form.agree) {
      setError("You must accept the Terms & Privacy Policy.");
      return;
    }

    setLoading(true);

    const { error: supaErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name, phone: form.phone },
      },
    });

    setLoading(false);

    if (supaErr) {
      setError(supaErr.message);
    } else {
      router.push("/dashboard"); // or /verify-email if you require confirmation
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl tracking-tight">
            Create Your Grow Grid Account
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Start growing dreams today
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              placeholder="Jane Doe"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Phone (optional)</label>
            <Input
              placeholder="555-123-4567"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={(e) => update("confirm", e.target.value)}
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              checked={form.agree}
              onCheckedChange={(val) => update("agree", val)}
              id="agree"
            />
            <label htmlFor="agree" className="text-sm leading-tight">
              I agree to the{" "}
              <a href="#" className="underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="underline">
                Privacy Policy
              </a>
              .
            </label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" disabled={loading} onClick={submit}>
            {loading ? "Creating…" : "Create Account"}
          </Button>

          <p className="text-sm text-center">
            Already have an account?{" "}
            <a href="/login" className="underline">
              Sign in
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
