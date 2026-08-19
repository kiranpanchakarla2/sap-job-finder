import { Share2 } from "lucide-react";
import { AdminPlaceholderPage } from "@/features/admin-shell/components/AdminPlaceholderPage";

export default function SocialMediaAdminPage() {
  return (
    <AdminPlaceholderPage
      title="Social Media Links & Settings"
      category="Platform"
      description="Manage corporate social profiles, automated broadcast integrations, OpenGraph tags, and feed connections."
      sprintMilestone="Sprint 10I"
      icon={Share2}
    />
  );
}
