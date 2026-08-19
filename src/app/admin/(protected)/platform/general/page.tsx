import { Settings } from "lucide-react";
import { AdminPlaceholderPage } from "@/features/admin-shell/components/AdminPlaceholderPage";

export default function PlatformGeneralAdminPage() {
  return (
    <AdminPlaceholderPage
      title="General Platform Settings"
      category="Platform"
      description="Configure platform metadata, global operational flags, branding parameters, and system maintenance modes."
      sprintMilestone="Sprint 10I"
      icon={Settings}
    />
  );
}
