import { MessageSquare } from "lucide-react";
import { AdminPlaceholderPage } from "@/features/admin-shell/components/AdminPlaceholderPage";

export default function ContactUsAdminPage() {
  return (
    <AdminPlaceholderPage
      title="Contact Us Inquiries"
      category="Content & Modules"
      description="Triage support inquiries, manage response statuses, assign tickets, and log internal resolution notes."
      sprintMilestone="Sprint 10H"
      icon={MessageSquare}
    />
  );
}
