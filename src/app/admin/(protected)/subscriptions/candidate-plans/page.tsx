import { FileText } from "lucide-react";
import { AdminPlaceholderPage } from "@/features/admin-shell/components/AdminPlaceholderPage";

export default function CandidatePlansAdminPage() {
  return (
    <AdminPlaceholderPage
      title="Candidate Subscription Plans"
      category="Subscriptions"
      description="Configure candidate tiers, pricing, duration options, feature entitlements, and active plan definitions."
      sprintMilestone="Sprint 10D"
      icon={FileText}
    />
  );
}
