import { Metadata } from "next";
import { CandidatePlansListPage } from "@/features/admin-plans";

export const metadata: Metadata = {
  title: "Candidate Subscription Plans | Super Admin",
  description: "Configure candidate subscription tiers, pricing, duration, feature entitlements, and active plan definitions.",
};

export default function CandidatePlansAdminPage() {
  return <CandidatePlansListPage />;
}
