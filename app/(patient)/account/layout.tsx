import { requirePatient } from "@/lib/auth";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requirePatient();
  return <>{children}</>;
}
