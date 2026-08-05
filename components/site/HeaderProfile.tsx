"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { SignOutForm } from "./SignOutForm";
import type { UserRole } from "@/lib/auth";

const ROLE_HOME: Record<UserRole, string> = {
  patient: "/account",
  dentist: "/dentist",
  admin: "/admin",
};

const signedOut = (
  <div className="flex items-center gap-4">
    <Link
      href="/auth/sign-in"
      className="font-utility text-body-s font-medium text-ink-950 transition hover:text-neem-600"
    >
      Sign in
    </Link>
    <Button href="/care" size="sm" className="min-w-[8rem]">
      Book a check-up
    </Button>
  </div>
);

/**
 * Signed-in state for the header. This is a client island so the server-side
 * Header never reads cookies — that keeps every public page cacheable instead
 * of forced dynamic by a per-view getUser() (D-19). Renders a fixed-width
 * placeholder until the session loads to avoid layout shift.
 */
export function HeaderProfile() {
  const [state, setState] = useState<"loading" | "out" | "in">("loading");
  const [profile, setProfile] = useState<{ name: string; home: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setState("out");
          return;
        }
        const { data } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled) return;
        setProfile({
          name: data?.full_name?.trim().split(/\s+/)[0] || "Account",
          home: data?.role ? ROLE_HOME[data.role as UserRole] : "/account",
        });
        setState("in");
      } catch {
        if (!cancelled) setState("out");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "in" && profile) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href={profile.home}
          className="font-utility text-body-s font-medium text-ink-950 transition hover:text-neem-600"
        >
          {profile.name}
        </Link>
        <SignOutForm />
      </div>
    );
  }
  if (state === "out") return signedOut;
  // Placeholder keeps the header width stable while the session loads.
  return <div className="flex min-w-[8rem] items-center justify-end" aria-hidden="true" />;
}
