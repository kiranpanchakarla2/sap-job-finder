import type { Metadata } from "next";
import { RoleSelectCards } from "@/components/auth/RoleSelectCards";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Create Account — ${siteConfig.name}`,
  description: `Create your ${siteConfig.name} account as a candidate or employer.`,
};

export default function RegisterRolePage() {
  return (
    <RoleSelectCards
      title="Create your account"
      subtitle="Choose the account type that matches your goals."
      mode="register"
    />
  );
}
