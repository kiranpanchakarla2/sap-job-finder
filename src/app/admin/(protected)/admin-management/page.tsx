import { ShieldAlert } from "lucide-react";
import { AdminPlaceholderPage } from "@/features/admin-shell/components/AdminPlaceholderPage";

export default function AdminManagementPage() {
  return (
    <AdminPlaceholderPage
      title="Admin Management"
      category="Security & Governance"
      description="Provision internal administrator accounts, assign granular role permissions, and manage 2FA security policies."
      sprintMilestone="Sprint 10J"
      icon={ShieldAlert}
    />
  );
}
