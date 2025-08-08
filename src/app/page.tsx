"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

/* ----------------------------- */
/*  MAIN PAGE COMPONENT          */
/* ----------------------------- */
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/70 to-white">
      {/* HERO */}
      <header className="container mx-auto flex flex-col items-center justify-center text-center px-4 py-32 space-y-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-extrabold leading-tight max-w-3xl"
        >
          Grow Dreams <span className="text-primary">Pin by Pin</span>
        </motion.h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
          The hands-on way for families to invest in a child’s future and watch
          every milestone come to life.
        </p>
      </header>

      {/* CTA STRIP */}
      <main className="container mx-auto flex-1 px-4 pb-24">
        <div className="grid gap-8 md:grid-cols-3">
          <CTA
            title="Gift a Grid"
            copy="Send a board, starter pins, and real funds—perfect for birthdays or baby showers."
            href="/gift"
            color="default"               /* button variant */
          />
          <CTA
            title="Claim a Grid"
            copy="Received a Grow Grid? Activate it here with your gift code."
            href="/claim"
            color="secondary"
          />
          <CTA
            title="Log In"
            copy="Already growing? Sign in to track progress."
            href="/login"
            color="ghost"                 /* renders as a text link */
          />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-8 border-t text-center text-sm text-muted-foreground">
        © Grow Grid 2025
      </footer>
    </div>
  );
}

/* ----------------------------- */
/*  CTA HELPER COMPONENT         */
/* ----------------------------- */
type CTAProps = {
  title: string;
  copy: string;
  href: string;
  color: "default" | "secondary" | "ghost";
};

function CTA({ title, copy, href, color }: CTAProps) {
  const asButton = color === "default" || color === "secondary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="flex flex-col bg-card shadow-sm rounded-xl p-6"
    >
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground flex-1 mb-4">{copy}</p>

      {asButton ? (
        <Button variant={color} size="sm" className="self-start" asChild>
          <Link href={href} className="inline-flex items-center gap-1">
            {title} <ArrowRight size={16} />
          </Link>
        </Button>
      ) : (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm underline"
        >
          {title} <ArrowRight size={16} />
        </Link>
      )}
    </motion.div>
  );
}
