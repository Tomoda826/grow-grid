"use client"; 

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Truck, QrCode } from "lucide-react";
import { motion } from "framer-motion";

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/50 p-6">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 120 }}>
        <CheckCircle2 size={72} className="text-emerald-500" />
      </motion.div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-center">Your Gift Is On Its Way!</h1>
      <p className="mt-2 text-muted-foreground text-center max-w-md">
        We’ve emailed a confirmation to <strong>you@example.com</strong>. Your Grow Grid board will ship within 2 business days. The child will receive a gift card and starter pins along with the board.
      </p>

      {/* Order Summary Card */}
      <Card className="w-full max-w-lg mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span>Order #</span>
            <span>GG-302514</span>
          </div>
          <div className="flex justify-between">
            <span>Recipient</span>
            <span>Inara (Age 4)</span>
          </div>
          <div className="flex justify-between">
            <span>Board Layout</span>
            <span>Portrait</span>
          </div>
          <div className="flex justify-between">
            <span>Kick‑start Amount</span>
            <span>$100</span>
          </div>
          <div className="flex justify-between">
            <span>Estimated Arrival</span>
            <span>May 28 – May 31</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="mt-8 flex flex-col md:flex-row gap-4">
        <Button variant="secondary" className="flex items-center gap-2">
          <Truck size={16} /> Track Shipment
        </Button>
        <Button className="flex items-center gap-2">
          <QrCode size={16} /> View Claim Instructions
        </Button>
        <Button variant="ghost" onClick={() => (window.location.href = "/dashboard")}>Go to Dashboard</Button>
      </div>
    </div>
  );
}
