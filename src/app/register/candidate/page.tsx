import type { Metadata } from "next";
import { RegisterCandidate } from "@/auth/RegisterCandidate";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Candidate Registration — ${siteConfig.name}`,
  description: "Create a candidate account to find SAP jobs on SAP Jobs Finder.",
};

export default function RegisterCandidatePage() {
  return <RegisterCandidate />;
}
