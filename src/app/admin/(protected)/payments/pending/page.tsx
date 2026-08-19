import { Clock } from "lucide-react";
import { AdminPlaceholderPage } from "@/features/admin-shell/components/AdminPlaceholderPage";

export default function PendingPaymentsAdminPage() {
  return (
    <AdminPlaceholderPage
      title="Pending Payments"
      category="Payments"
      description="Track outstanding payment verifications, awaiting manual proof review or banking reconciliation."
      sprintMilestone="Sprint 10E"
      icon={Clock}
    />
  );
}
