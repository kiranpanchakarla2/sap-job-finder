import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Sign Up — ${siteConfig.name}`,
  description: `Create your ${siteConfig.name} account and start applying to SAP roles.`,
};

export default function SignUpPage() {
  return <SignUpForm />;
}
