// src/app/claim/success/ClaimSuccessClient.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* --- helper to center content --- */
const Center = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex items-center justify-center p-6">
    {children}
  </div>
);

export default function ClaimSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gridId = searchParams.get("grid") ?? "";

  const [giftAmount, setGiftAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!gridId) return;

    (async () => {
      const { data } = await supabase
        .from("transactions")
        .select("amount_cents")
        .eq("grid_id", gridId)
        .eq("type", "gift")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) setGiftAmount(data.amount_cents / 100);
    })();
  }, [gridId]);

  return (
    <Center>
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>🎉 Gift Claimed Successfully!</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {gridId && (
            <p className="text-sm text-muted-foreground">
              Grid&nbsp;ID:&nbsp;<code>{gridId}</code>
            </p>
          )}

          {giftAmount !== null && (
            <p className="text-lg font-semibold">
              Gift&nbsp;Amount:&nbsp;${giftAmount.toLocaleString()}
            </p>
          )}

          <p className="text-sm">
            Your Grow&nbsp;Grid balance has been updated.
          </p>

          <Button onClick={() => router.push("/dashboard")}>
            Go&nbsp;to&nbsp;Dashboard
          </Button>
        </CardContent>
      </Card>
    </Center>
  );
}
