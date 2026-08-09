import type { Metadata } from "next";
import { RoleSelectCards } from "@/components/auth/RoleSelectCards";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Login — ${siteConfig.name}`,
  description: `Choose candidate or employer login for ${siteConfig.name}.`,
};

export default function LoginRolePage() {
  return (
    <RoleSelectCards
      title="Welcome back"
      subtitle="Select how you want to continue."
      mode="login"
    />
  );
}
