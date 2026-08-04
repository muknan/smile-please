import { requireRole } from "@/lib/auth";

export default async function DentistLayout({ children }: { children: React.ReactNode }) {
  await requireRole("dentist");
  return <>{children}</>;
}
