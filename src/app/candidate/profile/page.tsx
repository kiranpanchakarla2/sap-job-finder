import { PlaceholderPage } from "@/components/dashboard/shared/PlaceholderPage";

export default function Page() {
  return (
    <PlaceholderPage
      title="My Profile"
      description="Manage your candidate profile details."
      backHref="/candidate/dashboard"
    />
  );
}
