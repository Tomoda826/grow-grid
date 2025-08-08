"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    const { error: supaErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (supaErr) {
      setError(supaErr.message);
    } else {
      router.push(nextPath);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl tracking-tight">Grow Grid</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" disabled={loading} onClick={submit}>
            {loading ? "Signing in…" : "Sign In"}
          </Button>

          <div className="flex justify-between text-sm pt-2">
            <a href="#" className="underline text-muted-foreground">
              Forgot password?
            </a>
            <span>
              New here?{" "}
              <a href="/signup" className="underline">
                Create account
              </a>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
