import { redirect } from "next/navigation";

/**
 * Legacy route — Sprint 1 employer auth lives at `/employer/login`.
 */
export default function LegacyEmployerLoginPage() {
  redirect("/employer/login");
}
