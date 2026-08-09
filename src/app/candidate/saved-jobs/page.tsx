import { PlaceholderPage } from "@/components/dashboard/shared/PlaceholderPage";

export default function Page() {
  return (
    <PlaceholderPage
      title="Saved Jobs"
      description="Jobs you bookmarked for later."
      backHref="/candidate/dashboard"
    />
  );
}
