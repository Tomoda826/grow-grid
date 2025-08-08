"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

const fmtUsd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n
  );

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function ClaimSuccessClient() {
  const router = useRouter();
  const params = useSearchParams();

  // Read all values exactly as the current flow provides them
  const {
    giftCode,
    giver,
    amount,
    fv,
    pinValue,
    pinsEarned,
    interestPins,
    goalAmount,
    gridId,
  } = useMemo(() => {
    const num = (key: string) => {
      const v = params.get(key);
      const n = v == null ? NaN : Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    return {
      // your flow sends "code" in the URL; keep that name
      giftCode: params.get("code") ?? "—",
      giver: params.get("giver") ?? "Someone",
      amount: num("amount"), // dollars
      fv: num("fv"), // dollars
      pinValue: params.get("pinValue") ?? "0.00",
      pinsEarned: params.get("pinsEarned") ?? "0",
      interestPins: params.get("interestPins") ?? "0",
      goalAmount: num("goalAmount"), // dollars
      // optional, used only to show latest gift if present (parity with your previous client file)
      gridId: params.get("grid") ?? "",
    };
  }, [params]);

  // Optional: show latest gift found for this grid (kept from your prior implementation)
  const [latestGiftAmount, setLatestGiftAmount] = useState<number | null>(null);

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
        setLatestGiftAmount(data.amount_cents / 100);
      }
    })();
  }, [gridId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/50 p-6">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120 }}
      >
        <CheckCircle2 size={80} className="text-emerald-500" />
      </motion.div>

      <h1 className="mt-6 text-3xl font-bold text-center">Grid Successfully Claimed!</h1>

      <p className="mt-2 text-muted-foreground text-center max-w-md">
        {giver} gifted you <strong>{fmtUsd(amount)}</strong>. Your pins are ready—let’s
        watch them grow!
      </p>

      <Card className="w-full max-w-lg mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Gift Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Gift Code" value={giftCode} />
          <Row label="Kick-start Amount" value={fmtUsd(amount)} />
          <Row label="Current Pins" value={pinsEarned} />
          <Row label="Interest Pins (projected)" value={interestPins} />
          <Row label="Pin Value" value={`$${pinValue}`} />
          <Row label="Goal Amount" value={fmtUsd(goalAmount)} />
          <Row label="Projected Value" value={fmtUsd(fv)} />

          {gridId && <Row label="Grid ID" value={gridId} />}
          {latestGiftAmount !== null && (
            <Row label="Latest Gift Found (from Supabase)" value={fmtUsd(latestGiftAmount)} />
          )}
        </CardContent>
      </Card>

      <Button className="mt-8" onClick={() => router.push("/dashboard")}>
        Go to My Dashboard
      </Button>
    </div>
  );
}
