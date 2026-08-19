import { Briefcase } from "lucide-react";
import { AdminPlaceholderPage } from "@/features/admin-shell/components/AdminPlaceholderPage";

export default function JobsAdminPage() {
  return (
    <AdminPlaceholderPage
      title="Job Moderation & Management"
      category="Content & Modules"
      description="Moderate employer job postings, review flagged listings, manage featured promotions, and audit hiring status."
      sprintMilestone="Sprint 10G"
      icon={Briefcase}
    />
  );
}
