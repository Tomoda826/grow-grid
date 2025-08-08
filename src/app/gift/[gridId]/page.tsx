"use client";

import { useState, useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // shadcn helper

/* ---------- tiny Textarea component (shadcn style) ---------- */
const Textarea = (
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) => {
  const { className, ...rest } = props;
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...rest}
    />
  );
};

/* ---------- page component ---------- */
export default function GiftPage() {
const { gridId } = useParams<{ gridId: string }>();

  /* verify grid exists */
  const [gridExists, setGridExists] = useState<boolean | null>(null);

  /* form state */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("grids")
        .select("id")
        .eq("id", gridId)
        .single();
      setGridExists(!!data);
    })();
  }, [gridId]);

  if (gridExists === false) return notFound();
  if (gridExists === null) return <Center>Loading…</Center>;

  async function submit() {
    if (!name || !amount) return;
    setSending(true);

    const { error } = await supabase.rpc("add_gift_to_grid", {
      p_grid_id: gridId,
      p_amount_cents: Math.round(Number(amount) * 100),
      p_giver_name: name,
      p_giver_email: email || null,
      p_message: message || null,
    });

    setSending(false);
    if (error) {
      alert(error.message);
      return;
    }
    setSent(true);
  }

  if (sent)
    return (
      <Center>
        <Card className="text-center max-w-sm">
          <CardHeader>
            <CardTitle>🎉 Thank you!</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your gift has been added to the grid.</p>
          </CardContent>
        </Card>
      </Center>
    );

  return (
    <Center>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Send a Gift</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Your Name">
            <Input
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
            />
          </Field>

          <Field label="Email (optional)">
            <Input
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
            />
          </Field>

          <Field label="Gift Amount (USD)">
            <Input
              type="number"
              min="1"
              placeholder="50"
              value={amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAmount(e.target.value)
              }
            />
          </Field>

          <Field label="Message (optional)">
            <Textarea
              rows={3}
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setMessage(e.target.value)
              }
            />
          </Field>

          <Button
            className="w-full"
            disabled={sending || !name || !amount}
            onClick={submit}
          >
            {sending ? "Sending…" : "Send Gift"}
          </Button>
        </CardContent>
      </Card>
    </Center>
  );
}

/* ---------- helpers ---------- */
const Center = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    {children}
  </div>
);

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="text-sm font-medium">{label}</label>
    {children}
  </div>
);
