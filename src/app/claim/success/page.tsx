"use client";

import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const fmt = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100
  );

export default function ClaimSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();

  /* pull params */
  const giftCode   = params.get("code") ?? "—";          // <— now code
  const giver      = params.get("giver") ?? "Someone";
  const amount     = Number(params.get("amount") ?? 0) * 100;
  const fv         = Number(params.get("fv") ?? 0) * 100;
  const pinValue   = params.get("pinValue") ?? "0.00";
  const pinsEarned = params.get("pinsEarned") ?? "0";
  const interestPins = params.get("interestPins") ?? "0";
  const goalAmount = Number(params.get("goalAmount") ?? 0) * 100;

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
        {giver} gifted you&nbsp;
        <strong>{fmt(amount)}</strong>. Your pins are ready—let’s watch them
        grow!
      </p>

      <Card className="w-full max-w-lg mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Gift Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Gift Code" value={giftCode} />  {/* updated */}
          <Row label="Kick-start Amount" value={fmt(amount)} />
          <Row label="Current Pins" value={pinsEarned} />
          <Row label="Interest Pins (projected)" value={interestPins} />
          <Row label="Pin Value" value={`$${pinValue}`} />
          <Row label="Goal Amount" value={fmt(goalAmount)} />
          <Row label="Projected Value" value={fmt(fv)} />
        </CardContent>
      </Card>

      <Button className="mt-8" onClick={() => router.push("/dashboard")}>
        Go to My Dashboard
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
