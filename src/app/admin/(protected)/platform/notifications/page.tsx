import { Bell } from "lucide-react";
import { AdminPlaceholderPage } from "@/features/admin-shell/components/AdminPlaceholderPage";

export default function PlatformNotificationsAdminPage() {
  return (
    <AdminPlaceholderPage
      title="Platform Notification Templates"
      category="Platform"
      description="Configure email alerts, transactional triggers, broadcast system notices, and SMS reminder templates."
      sprintMilestone="Sprint 10I"
      icon={Bell}
    />
  );
}
