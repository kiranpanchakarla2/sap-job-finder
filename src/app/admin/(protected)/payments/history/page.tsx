import { History } from "lucide-react";
import { AdminPlaceholderPage } from "@/features/admin-shell/components/AdminPlaceholderPage";

export default function PaymentHistoryAdminPage() {
  return (
    <AdminPlaceholderPage
      title="Payment History"
      category="Payments"
      description="Access comprehensive payment transaction logs, audit history, refunds, and financial reporting records."
      sprintMilestone="Sprint 10E"
      icon={History}
    />
  );
}
