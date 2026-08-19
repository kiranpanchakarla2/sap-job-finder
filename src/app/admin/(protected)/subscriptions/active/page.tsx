import { CheckCircle2 } from "lucide-react";
import { AdminPlaceholderPage } from "@/features/admin-shell/components/AdminPlaceholderPage";

export default function ActiveSubscriptionsAdminPage() {
  return (
    <AdminPlaceholderPage
      title="Active Subscriptions"
      category="Subscriptions"
      description="Monitor currently active candidate and employer subscriptions, entitlements, and renewal statuses."
      sprintMilestone="Sprint 10D"
      icon={CheckCircle2}
    />
  );
}
