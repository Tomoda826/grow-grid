"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, QrCode } from "lucide-react";
import { motion } from "framer-motion";

type GiftRow = {
  code: string;
  layout: string;
  starter_amount: number;
  recipient_name: string;
};

function OrderSuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const code = params.get("code");

  const [gift, setGift] = useState<GiftRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* fetch gift on mount */
  useEffect(() => {
    if (!code) {
      setError("Missing gift code in URL.");
      setLoading(false);
      return;
    }

    (async () => {
      if (!supabase) {
        setError("Database not configured.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("gifts")
        .select("code, layout, starter_amount, recipient_name")
        .eq("code", code)
        .maybeSingle();

      if (error || !data) {
        setError("Gift not found.");
      } else {
        setGift(data as GiftRow);
      }
      setLoading(false);
    })();
  }, [code]);

  /* money helper */
  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p>{error}</p>
        <Button variant="ghost" onClick={() => router.push("/")}>
          Back Home
        </Button>
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/50 p-6">
      {/* Check icon */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120 }}
      >
        <CheckCircle2 size={72} className="text-emerald-500" />
      </motion.div>

      {/* Headline */}
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-center">
        Your Gift Is On Its Way!
      </h1>
      <p className="mt-2 text-muted-foreground text-center max-w-md">
        We’ve emailed a confirmation. Your Grow Grid board will ship within
        2&nbsp;business&nbsp;days.
      </p>

      {/* Order Summary */}
      <Card className="w-full max-w-lg mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Row label="Gift Code" value={gift!.code} />
          <Row label="Recipient" value={gift!.recipient_name} />
          <Row label="Board Layout" value={gift!.layout} />
          <Row label="Kick-start Amount" value={fmt(gift!.starter_amount)} />
          <Row label="Estimated Arrival" value="May 28 – May 31" />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="mt-8 flex flex-col md:flex-row gap-4">
        {/* Track Shipment feature hidden for now */}
        {/* <Button variant="secondary" className="flex items-center gap-2">
          <Truck size={16} />
          Track Shipment
        </Button> */}
        <Button className="flex items-center gap-2">
          <QrCode size={16} />
          View Claim Instructions
        </Button>
        <Button variant="ghost" onClick={() => router.push("/claim")}>
          Claim Grid for Yourself
        </Button>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}

/* small row helper */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
