"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function SiteHeader() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  /* watch session */
  useEffect(() => {
    // If supabase is not configured, just set loading to false
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evt, session) => {
      setLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* logo + name */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          {/* Replace with your SVG or <Image> */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-primary"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2 2 7v10l10 5 10-5V7z" />
          </svg>
          <span className="text-lg">Grow&nbsp;Grid</span>
        </Link>

        {/* nav links */}
        {!loading && (
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/gift" className="hover:text-primary">
              Gift&nbsp;a&nbsp;Grid
            </Link>

            {loggedIn && (
              <>
                <Link href="/dashboard" className="hover:text-primary">
                  Dashboard
                </Link>
                <Link href="/profile" className="hover:text-primary">
                  Profile
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  className="px-3"
                  onClick={handleLogout}
                >
                  Log Out
                </Button>
              </>
            )}

            {!loggedIn && (
              <>
                <Link href="/login" className="hover:text-primary">
                  Log&nbsp;In
                </Link>
                <Button
                  size="sm"
                  onClick={() => router.push("/signup")}
                  className="px-3"
                >
                  Sign Up
                </Button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
