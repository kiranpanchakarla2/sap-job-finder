import type { Metadata } from "next";
import { ForgotPassword } from "@/auth/ForgotPassword";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Forgot Password — ${siteConfig.name}`,
  description: "Reset your ERPJobs account password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
