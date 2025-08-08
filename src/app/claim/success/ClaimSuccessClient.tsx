"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const fmtUsd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n
  );

export default function ClaimSuccessClient() {
  const params = useSearchParams();
  const router = useRouter();

  // All URL params you’d been using
  const {
    code,
    giver,
    amount,
    fv,
    pinValue,
    pinsEarned,
    interestPins,
    goalAmount,
  } = useMemo(() => {
    const getNum = (key: string) => {
      const v = Number(params.get(key) ?? 0);
      return Number.isFinite(v) ? v : 0;
    };

    return {
      code: params.get("code") ?? params.get("grid_id") ?? "—",
      giver: params.get("giver") ?? "Someone",
      amount: getNum("amount"),        // dollars
      fv: getNum("fv"),                // dollars
      pinValue: params.get("pinValue") ?? "0.00",
      pinsEarned: params.get("pinsEarned") ?? "0",
      interestPins: params.get("interestPins") ?? "0",
      goalAmount: getNum("goalAmount"), // dollars
    };
  }, [params]);

  // If you still pass `grid` in some flows, we’ll show the latest gift fetched from Supabase
  const gridId = params.get("grid") ?? "";
  const [giftAmount, setGiftAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!gridId) return;

    (async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("amount_cents")
        .eq("grid_id", gridId)
        .eq("type", "gift")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data?.amount_cents != null) {
        setGiftAmount(data.amount_cents / 100);
      }
    })();
  }, [gridId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/50 p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120 }}
      >
        <CheckCircle2 size={80} className="text-emerald-500" />
      </motion.div>

      <h1 className="mt-6 text-3xl font-bold text-center">
        Grid Successfully Claimed!
      </h1>

      <p className="mt-2 text-muted-foreground text-center max-w-md">
        {giver} gifted you <strong>{fmtUsd(amount)}</strong>. Your pins are
        ready—let’s watch them grow!
      </p>

      <Card className="w-full max-w-lg mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Gift Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Gift Code" value={code} />
          <Row label="Kick-start Amount" value={fmtUsd(amount)} />
          <Row label="Current Pins" value={pinsEarned} />
          <Row label="Interest Pins (projected)" value={interestPins} />
          <Row label="Pin Value" value={`$${pinValue}`} />
          <Row label="Goal Amount" value={fmtUsd(goalAmount)} />
          <Row label="Projected Value" value={fmtUsd(fv)} />

          {gridId && (
            <Row label="Grid ID (debug)" value={gridId} />
          )}

          {giftAmount !== null && (
            <Row label="Latest Gift Found (Supabase)" value={fmtUsd(giftAmount)} />
          )}
        </CardContent>
      </Card>

      <Button className="mt-8" onClick={() => router.push("/dashboard")}>
        Go to My Dashboard
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{String(value)}</span>
    </div>
  );
}
