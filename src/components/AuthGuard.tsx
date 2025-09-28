"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Wrap protected pages with <AuthGuard> … </AuthGuard>
 * Redirects unauthenticated users to /login (with ?next=path).
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // initial check
    if (!supabase) {
      router.replace(`/login?next=${pathname}`);
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace(`/login?next=${pathname}`);
      setChecking(false);
    });

    // listen for future changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) router.replace(`/login?next=${pathname}`);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (checking) return null; // or a spinner
  return <>{children}</>;
}
