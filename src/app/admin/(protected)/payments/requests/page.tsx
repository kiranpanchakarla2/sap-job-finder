import { Inbox } from "lucide-react";
import { AdminPlaceholderPage } from "@/features/admin-shell/components/AdminPlaceholderPage";

export default function PaymentRequestsAdminPage() {
  return (
    <AdminPlaceholderPage
      title="Payment Requests"
      category="Payments"
      description="Review and process incoming manual payment requests, offline bank transfers, and verification proofs."
      sprintMilestone="Sprint 10E"
      icon={Inbox}
    />
  );
}
