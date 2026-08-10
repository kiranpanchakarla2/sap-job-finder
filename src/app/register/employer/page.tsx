import { redirect } from "next/navigation";

/**
 * Legacy route — Sprint 1 employer auth lives at `/employer/register`.
 */
export default function LegacyEmployerRegisterPage() {
  redirect("/employer/register");
}
