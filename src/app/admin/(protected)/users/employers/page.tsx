import { Metadata } from "next";
import { EmployersListPage } from "@/features/admin-users";

export const metadata: Metadata = {
  title: "Employer Management | Super Admin",
  description: "Manage registered company profiles, team hierarchies, verification status, and hiring operations.",
};

export default function EmployersAdminPage() {
  return <EmployersListPage />;
}
