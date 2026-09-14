"use client";

import { Suspense, useActionState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Logo, SmileMark } from "@/components/site/Logo";
import { requestSignInLink, type SignInState } from "../actions";

const initial: SignInState = { status: "idle" };

export function SignInForm({ renderedAt }: { renderedAt: string }) {
  return <Suspense fallback={null}><Form renderedAt={renderedAt} /></Suspense>;
}

function AuthHeader() {
  return (
    <header className="border-b border-neem-100 bg-mineral-50">
      <div className="container-content flex h-16 items-center justify-between sm:h-[72px]">
        <Link href="/" className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-neem-600 focus-visible:ring-offset-4" aria-label="Smile Please — home"><Logo /></Link>
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded px-2 font-utility text-body-s font-medium text-ink-950 transition-colors hover:text-neem-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-neem-600">
          <ArrowLeft size={18} aria-hidden="true" /> Back to site
        </Link>
      </div>
    </header>
  );
}

function AuthIntro() {
  return (
    <aside className="hidden bg-neem-900 p-10 text-chalk-0 lg:flex lg:flex-col lg:justify-between">
      <div>
        <SmileMark className="h-12 w-12 text-marigold-500" />
        <p className="mt-12 font-utility text-label uppercase tracking-[.14em] text-neem-100">Your Smile Please account</p>
        <h2 className="mt-5 max-w-sm font-display text-display-l">Care stays within reach.</h2>
        <p className="mt-5 max-w-sm text-body-l text-chalk-0/75">Use your email to view appointments, keep your details current, or continue supporting community care.</p>
      </div>
      <p className="max-w-xs text-body-s text-chalk-0/65">No password to remember. A private sign-in link is sent only to your inbox.</p>
    </aside>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-mineral-50 sm:min-h-[calc(100vh-4.5rem)]">
      <div className="mx-auto grid min-h-[inherit] max-w-[1440px] lg:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.1fr)]">
        <AuthIntro />
        <section className="flex items-center px-5 py-14 sm:px-10 lg:px-16"><div className="w-full max-w-md">{children}</div></section>
      </div>
    </main>
  );
}

function Form({ renderedAt }: { renderedAt: string }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/account";
  const reason = searchParams.get("reason");
  const errorParam = searchParams.get("error");
  const [state, formAction, pending] = useActionState(requestSignInLink, initial);

  if (state.status === "sent") {
    return <><AuthHeader /><AuthShell>
      <p className="font-utility text-label uppercase tracking-[.14em] text-neem-600">Sign in</p>
      <h1 className="mt-5 text-display-l">Check your email</h1>
      <p className="mt-4 text-body-l">We&apos;ve sent a sign-in link to <strong>{state.email}</strong>. It expires in one hour.</p>
      <p className="mt-2 text-body-s text-ink-950/75">No link in your inbox? Check the spam folder first — or use a different address below.</p>
      <div className="mt-10 flex flex-col gap-4">
        <Link href="/auth/sign-in" className="inline-flex min-h-11 items-center font-utility text-body-s font-medium text-neem-600 underline underline-offset-4 hover:text-neem-900">Use a different email</Link>
        <Link href="/" className="inline-flex min-h-11 items-center font-utility text-body-s font-medium text-neem-600 underline underline-offset-4 hover:text-neem-900">Back to the site</Link>
      </div>
    </AuthShell></>;
  }

  return <><AuthHeader /><AuthShell>
    <p className="font-utility text-label uppercase tracking-[.14em] text-neem-600">Sign in</p>
    <h1 className="mt-5 text-display-l">Sign in to your account</h1>
    <p className="mt-4 text-body-l text-ink-950/70">Enter the email you use with Smile Please. We&apos;ll send you a link that signs you in without a password.</p>
    <p className="mt-4 border-l-2 border-marigold-500 pl-4 text-body-s text-ink-950/70">The link is single-use and expires after one hour. We never ask for your password.</p>

    {reason === "admin_timeout" && <p role="alert" aria-live="polite" className="mt-6 rounded border border-clay-600/40 bg-clay-600/5 px-4 py-3 text-body-s text-clay-600">Your admin session expired. Sign in again.</p>}
    {errorParam === "link_expired" && <p role="alert" aria-live="polite" className="mt-6 rounded border border-clay-600/40 bg-clay-600/5 px-4 py-3 text-body-s text-clay-600">That sign-in link has expired or was already used. Request a new one below.</p>}

    <form action={formAction} className="mt-8 space-y-6">
      {/* Honeypot and timestamp are server-side abuse protections; keep their names stable. */}
      <input type="text" name="website" value="" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" />
      <input type="hidden" name="renderedAt" value={renderedAt} />
      <input type="hidden" name="next" value={next} />
      <Field label="Email" htmlFor="email" required>
        <Input id="email" name="email" type="email" autoComplete="email" required aria-required="true" aria-describedby="signin-error" placeholder="you@example.com" />
      </Field>
      {state.status === "error" && <p id="signin-error" role="alert" aria-live="polite" className="text-body-s text-clay-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">{pending ? "Sending…" : "Send me a sign-in link"}</Button>
    </form>
  </AuthShell></>;
}
