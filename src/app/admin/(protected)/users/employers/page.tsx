import { Building2 } from "lucide-react";
import { AdminPlaceholderPage } from "@/features/admin-shell/components/AdminPlaceholderPage";

export default function EmployersAdminPage() {
  return (
    <AdminPlaceholderPage
      title="Employer Management"
      category="Users"
      description="Manage employer companies, team recruiter memberships, and company account statuses."
      sprintMilestone="Sprint 10C"
      icon={Building2}
    />
  );
}
