import { ScrollText } from "lucide-react";
import { AdminPlaceholderPage } from "@/features/admin-shell/components/AdminPlaceholderPage";

export default function AuditLogsAdminPage() {
  return (
    <AdminPlaceholderPage
      title="System Audit Logs"
      category="Security & Governance"
      description="Trace administrative actions, authorization events, payment status changes, and critical security events."
      sprintMilestone="Sprint 10J"
      icon={ScrollText}
    />
  );
}
