"use client";

import { Suspense } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { requestSignInLink, type SignInState } from "../actions";

const initial: SignInState = { status: "idle" };

export function SignInForm({ renderedAt }: { renderedAt: string }) {
  // useSearchParams must sit under a Suspense boundary so the page can be
  // statically prerendered.
  return (
    <Suspense fallback={null}>
      <Form renderedAt={renderedAt} />
    </Suspense>
  );
}

function Form({ renderedAt }: { renderedAt: string }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/account";
  const reason = searchParams.get("reason");
  const errorParam = searchParams.get("error");


  const [state, formAction, pending] = useActionState(requestSignInLink, initial);

  if (state.status === "sent") {
    return (
      <main className="py-24">
        <div className="container-content max-w-2xl">
          <p className="text-label">Sign in</p>
          <h1 className="mt-6 text-display-l">Check your email</h1>
          <p className="mt-4 text-body-l">
            We&apos;ve sent a sign-in link to <strong>{state.email}</strong>. It expires in one hour.
          </p>
          <p className="mt-2 text-body-s text-ink-950/60">
            No link in your inbox? Check the spam folder, then try again.
          </p>
          <div className="mt-10">
            <Link
              href="/auth/sign-in"
              className="font-utility text-body-s font-medium text-neem-600 underline-offset-2 hover:underline"
            >
              Use a different email
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="py-24">
      <div className="container-content max-w-2xl">
        <p className="text-label">Sign in</p>
        <h1 className="mt-6 max-w-3xl text-display-l">Sign in to your account</h1>
        <p className="mt-4 max-w-[65ch] text-body-l text-ink-950/70">
          Enter the email you use with Smile Please. We&apos;ll send you a link that signs you in
          without a password.
        </p>

        {reason === "admin_timeout" && (
          <p role="alert" aria-live="polite" className="mt-6 rounded border border-clay-600/40 bg-clay-600/5 px-4 py-3 text-body-s text-clay-600">
            Your admin session expired. Sign in again.
          </p>
        )}
        {errorParam === "link_expired" && (
          <p role="alert" aria-live="polite" className="mt-6 rounded border border-clay-600/40 bg-clay-600/5 px-4 py-3 text-body-s text-clay-600">
            That sign-in link has expired or was already used. Request a new one below.
          </p>
        )}

        <p className="mt-8">
          <Link href="/" className="font-utility text-body-s font-medium text-neem-600 underline underline-offset-2 hover:underline">
            ← Back to the site
          </Link>
        </p>

        <form action={formAction} className="mt-6 max-w-md space-y-6">
          {/* Honeypot — must stay empty (Master §9.6). */}
          <input
            type="text"
            name="website"
            value=""
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="sr-only"
          />
          <input type="hidden" name="renderedAt" value={renderedAt} />
          <input type="hidden" name="next" value={next} />

          <Field label="Email" htmlFor="email" required>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-required="true"
              aria-describedby="signin-error"
              placeholder="you@example.com"
            />
          </Field>

          {state.status === "error" && (
            <p
              id="signin-error"
              role="alert"
              aria-live="polite"
              className="text-body-s text-clay-600"
            >
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send me a sign-in link"}
          </Button>
        </form>
      </div>
    </main>
  );
}
