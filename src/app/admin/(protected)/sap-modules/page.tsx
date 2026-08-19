import { Grid } from "lucide-react";
import { AdminPlaceholderPage } from "@/features/admin-shell/components/AdminPlaceholderPage";

export default function SapModulesAdminPage() {
  return (
    <AdminPlaceholderPage
      title="SAP Modules Management"
      category="Content & Modules"
      description="Manage SAP module taxonomies, core technical & functional specializations, certifications, and sub-skills."
      sprintMilestone="Sprint 10F"
      icon={Grid}
    />
  );
}
