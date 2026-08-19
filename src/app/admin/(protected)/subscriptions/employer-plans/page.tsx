import { Building2 } from "lucide-react";
import { AdminPlaceholderPage } from "@/features/admin-shell/components/AdminPlaceholderPage";

export default function EmployerPlansAdminPage() {
  return (
    <AdminPlaceholderPage
      title="Employer Subscription Plans"
      category="Subscriptions"
      description="Configure enterprise pricing tiers, job posting limits, talent search view caps, and team seat allocations."
      sprintMilestone="Sprint 10D"
      icon={Building2}
    />
  );
}
