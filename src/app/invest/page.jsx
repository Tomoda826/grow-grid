"use client"; 

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { motion } from "framer-motion";

export default function OneTimeInvestment() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("card1");
  const [isConfirming, setIsConfirming] = useState(false);

  const submit = () => {
    if (!amount) return;
    setIsConfirming(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/50">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <h1 className="text-lg font-semibold tracking-tight">Add One‑Time Investment</h1>
          <Button variant="secondary" size="sm" onClick={()=>window.history.back()}>← Back</Button>
        </div>
      </header>

      {/* FORM SECTION */}
      <main className="container mx-auto flex-1 p-4 flex flex-col items-center justify-center">
        <Card className="w-full max-w-xl shadow-sm">
          <CardHeader>
            <CardTitle>Enter Investment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amount */}
            <div>
              <label className="text-sm font-medium">Amount (USD)</label>
              <Input type="number" min="1" placeholder="e.g. 250" value={amount} onChange={e=>setAmount(e.target.value)} />
            </div>

            {/* Funding Method */}
            <div>
              <label className="text-sm font-medium">Funding Method</label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="card1">Visa ••••1234</SelectItem>
                  <SelectItem value="bank1">BoA Checking •••123</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" disabled={!amount} onClick={submit}>Review Investment</Button>
          </CardContent>
        </Card>

        {/* CONFIRMATION MODAL */}
        {isConfirming && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/30 flex items-center justify-center backdrop-blur-sm z-50">
            <Card className="w-[22rem] shadow-lg">
              <CardHeader>
                <CardTitle>Confirm Investment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">You’re about to invest <span className="font-semibold text-foreground">${amount}</span> using {method === "card1" ? "Visa ••••1234" : "BoA Checking •••123"}.</p>
                <p className="text-sm text-muted-foreground">Pins will update instantly after the transfer.</p>
                <div className="flex gap-4 pt-2">
                  <Button className="flex-1">Confirm & Invest</Button>
                  <Button variant="ghost" className="flex-1" onClick={()=>setIsConfirming(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="py-4 border-t text-center text-sm text-muted-foreground">© Grow Grid 2025</footer>
    </div>
  );
}
