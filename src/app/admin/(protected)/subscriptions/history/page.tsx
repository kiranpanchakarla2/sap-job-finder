import { History } from "lucide-react";
import { AdminPlaceholderPage } from "@/features/admin-shell/components/AdminPlaceholderPage";

export default function SubscriptionHistoryAdminPage() {
  return (
    <AdminPlaceholderPage
      title="Subscription History"
      category="Subscriptions"
      description="Review full historical ledger of subscription lifecycles, upgrades, downgrades, and expirations."
      sprintMilestone="Sprint 10D"
      icon={History}
    />
  );
}
