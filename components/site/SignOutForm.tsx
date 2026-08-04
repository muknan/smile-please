import { Button } from "@/components/ui/Button";

/** POST-only sign-out; a plain form so no JS or stray link can end a session. */
export function SignOutForm() {
  return (
    <form action="/auth/sign-out" method="post">
      <Button type="submit" variant="ghost" size="sm">
        Sign out
      </Button>
    </form>
  );
}
