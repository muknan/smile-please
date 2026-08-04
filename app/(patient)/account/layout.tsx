import { requireUser } from "@/lib/auth";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
