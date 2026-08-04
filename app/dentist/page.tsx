import { redirect } from "next/navigation";

export default function DentistHomePage() {
  redirect("/dentist/appointments");
}
