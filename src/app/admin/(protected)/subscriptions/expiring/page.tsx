import { Clock } from "lucide-react";
import { AdminPlaceholderPage } from "@/features/admin-shell/components/AdminPlaceholderPage";

export default function ExpiringSubscriptionsAdminPage() {
  return (
    <AdminPlaceholderPage
      title="Expiring Soon Subscriptions"
      category="Subscriptions"
      description="Track subscriptions approaching expiration, grace periods, and renewal reminder queues."
      sprintMilestone="Sprint 10D"
      icon={Clock}
    />
  );
}
