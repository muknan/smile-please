"use client";

import { Suspense, useActionState, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, MailCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Logo, SmileMark } from "@/components/site/Logo";
import { PageTopLink } from "@/components/site/PageTopLink";
import { requestSignInLink, type SignInState } from "../actions";

const initial: SignInState = { status: "idle" };

export function SignInForm({ renderedAt }: { renderedAt: string }) {
  const [attempt, setAttempt] = useState(0);
  return <Suspense fallback={null}><Form key={attempt} renderedAt={renderedAt} onReset={() => setAttempt((value) => value + 1)} /></Suspense>;
}

function AuthHeader() {
  return (
    <header className="border-b border-neem-100 bg-mineral-50">
      <div className="container-content flex h-16 items-center justify-between sm:h-[72px]">
        <PageTopLink href="/" className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-neem-600 focus-visible:ring-offset-4" aria-label="Smile Please — home"><Logo /></PageTopLink>
        <PageTopLink href="/" className="inline-flex min-h-11 items-center gap-2 rounded px-2 font-utility text-body-s font-medium text-ink-950 transition-colors hover:text-neem-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-neem-600">
          <ArrowLeft size={18} aria-hidden="true" /> Back to site
        </PageTopLink>
      </div>
    </header>
  );
}

function AuthIntro() {
  return (
    <aside className="hidden bg-neem-900 p-10 text-chalk-0 lg:flex lg:flex-col lg:justify-between">
      <div>
        <SmileMark className="h-12 w-12" />
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
        <section className="flex items-start px-5 py-8 sm:px-10 sm:py-12 lg:items-center lg:px-16 lg:py-16"><div className="w-full max-w-lg">{children}</div></section>
      </div>
    </main>
  );
}

function Form({ renderedAt, onReset }: { renderedAt: string; onReset: () => void }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/account";
  const reason = searchParams.get("reason");
  const errorParam = searchParams.get("error");
  const [state, formAction, pending] = useActionState(requestSignInLink, initial);

  if (state.status === "sent") {
    return <><AuthHeader /><AuthShell>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neem-100 text-neem-700">
        <MailCheck size={24} aria-hidden="true" />
      </div>
      <p className="mt-6 font-utility text-label font-semibold uppercase tracking-[.14em] text-neem-600">Link sent</p>
      <h1 className="mt-3 text-display-l">Check your email.</h1>
      <div className="mt-6 rounded-panel border border-neem-100 bg-chalk-0 p-5 shadow-[0_16px_50px_rgba(27,48,41,0.07)] sm:p-8">
        <p className="text-body-l">We&apos;ve sent a private sign-in link to <strong className="break-all">{state.email}</strong>.</p>
        <p className="mt-3 text-body-s text-ink-950/70">It expires in one hour. If it is not in your inbox, check the spam folder before requesting another.</p>
      </div>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-6">
        <button type="button" onClick={onReset} className="inline-flex min-h-11 items-center font-utility text-body-s font-medium text-neem-600 underline underline-offset-4 hover:text-neem-900">Use a different email</button>
        <PageTopLink href="/" className="inline-flex min-h-11 items-center font-utility text-body-s font-medium text-neem-600 underline underline-offset-4 hover:text-neem-900">Back to the site</PageTopLink>
      </div>
    </AuthShell></>;
  }

  return <><AuthHeader /><AuthShell>
    <p className="font-utility text-label font-semibold uppercase tracking-[.14em] text-neem-600">Secure account access</p>
    <h1 className="mt-3 text-display-l">Welcome back.</h1>
    <p className="mt-3 max-w-[46ch] text-body-l text-ink-950/70">Enter the email you use with Smile Please. We&apos;ll send you a private link. No password needed.</p>

    {reason === "admin_timeout" && <p role="alert" aria-live="polite" className="mt-6 rounded border border-clay-600/40 bg-clay-600/5 px-4 py-3 text-body-s text-clay-600">Your admin session expired. Sign in again.</p>}
    {errorParam === "link_expired" && <p role="alert" aria-live="polite" className="mt-6 rounded border border-clay-600/40 bg-clay-600/5 px-4 py-3 text-body-s text-clay-600">That sign-in link has expired or was already used. Request a new one below.</p>}

    <div className="mt-7 rounded-panel border border-neem-100 bg-chalk-0 p-5 shadow-[0_16px_50px_rgba(27,48,41,0.07)] sm:p-8">
      <form action={formAction} onReset={(event) => event.preventDefault()} className="space-y-5">
        {/* Honeypot and timestamp are server-side abuse protections; keep their names stable. */}
        <input type="text" name="website" value="" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" />
        <input type="hidden" name="renderedAt" value={renderedAt} />
        <input type="hidden" name="next" value={next} />
        <Field label="Email address" htmlFor="email" required>
          <Input id="email" name="email" type="email" autoComplete="email" required aria-required="true" aria-describedby={state.status === "error" ? "signin-error signin-security" : "signin-security"} placeholder="you@example.com" />
        </Field>
        {state.status === "error" && <p id="signin-error" role="alert" aria-live="polite" className="text-body-s text-clay-600">{state.error}</p>}
        <Button type="submit" disabled={pending} className="w-full">{pending ? "Sending…" : "Email me a sign-in link"}</Button>
      </form>
      <div id="signin-security" className="mt-5 flex gap-3 border-t border-neem-100 pt-5 text-body-s text-ink-950/70">
        <ShieldCheck className="mt-0.5 shrink-0 text-neem-600" size={19} aria-hidden="true" />
        <p><strong className="font-medium text-ink-950">Private and password-free.</strong> The link works once and expires after one hour.</p>
      </div>
    </div>
    <p className="mt-5 text-body-s text-ink-950/70">Need care but do not have an account? <PageTopLink href="/care/request" className="font-medium text-neem-700 underline decoration-neem-600/40 underline-offset-4 hover:decoration-neem-700">Start a care request instead.</PageTopLink></p>
  </AuthShell></>;
}
