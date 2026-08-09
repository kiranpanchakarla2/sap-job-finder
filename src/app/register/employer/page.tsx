import type { Metadata } from "next";
import { RegisterEmployer } from "@/auth/RegisterEmployer";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Employer Registration — ${siteConfig.name}`,
  description: "Register your company and hire SAP professionals on ERPJobs.",
};

export default function RegisterEmployerPage() {
  return <RegisterEmployer />;
}
