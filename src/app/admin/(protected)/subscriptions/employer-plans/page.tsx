import { Metadata } from "next";
import { EmployerPlansListPage } from "@/features/admin-plans";

export const metadata: Metadata = {
  title: "Employer Subscription Plans | Super Admin",
  description: "Configure enterprise pricing tiers, job posting limits, talent search view caps, and team seat allocations.",
};

export default function EmployerPlansAdminPage() {
  return <EmployerPlansListPage />;
}
