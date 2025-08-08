"use client"; 

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import GiftWizard from "./gift_wizard";

// NOTE: Wizard placeholder div here. Integrate GiftWizard in real build.

export default function GiftLandingPage() {
  const [started, setStarted] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/70 to-white">
      {/* HERO / INTRO */}
      <section className="container mx-auto flex-1 flex flex-col items-center justify-center text-center px-4 py-24 space-y-8">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-4xl md:text-5xl font-extrabold max-w-3xl leading-tight">
          Give a Gift that <span className="text-primary">Grows</span>
        </motion.h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          Send a Grow Grid and help a child watch real money turn into real opportunities—one pin at a time.
        </p>
        {!started && (
          <Button size="lg" onClick={() => setStarted(true)}>Start a Gift</Button>
        )}
      </section>

      {/* ACTUAL WIZARD */}
      {started && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pb-20"
        >
          <GiftWizard />
        </motion.div>
      )}

      {/* FOOTER */}
      <footer className="py-8 border-t text-center text-sm text-muted-foreground">© Grow Grid 2025</footer>
    </div>
  );
}
