import type { Metadata } from "next";
import { makeRenderedAt } from "@/lib/antispam";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in", description: "Request a secure Smile Please sign-in link." };

export default function SignInPage() {
  return <SignInForm renderedAt={makeRenderedAt()} />;
}
