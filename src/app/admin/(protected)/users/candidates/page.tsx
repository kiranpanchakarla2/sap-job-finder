import { Metadata } from "next";
import { CandidatesListPage } from "@/features/admin-users";

export const metadata: Metadata = {
  title: "Candidate Management | Super Admin",
  description: "Manage registered candidate profiles, subscriptions, discoverability, and account statuses.",
};

export default function CandidatesAdminPage() {
  return <CandidatesListPage />;
}
