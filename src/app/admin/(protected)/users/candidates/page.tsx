import { UserRound } from "lucide-react";
import { AdminPlaceholderPage } from "@/features/admin-shell/components/AdminPlaceholderPage";

export default function CandidatesAdminPage() {
  return (
    <AdminPlaceholderPage
      title="Candidate Management"
      category="Users"
      description="Manage registered candidate profiles, verify credentials, and oversee candidate account lifecycle."
      sprintMilestone="Sprint 10C"
      icon={UserRound}
    />
  );
}
