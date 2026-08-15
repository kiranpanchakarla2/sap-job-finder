import { BulkImportDetailsPage } from "@/features/employer-jobs/pages/BulkImportDetailsPage";

export const metadata = {
  title: "Bulk Import Details | Employer Portal | SAP Jobs Finder",
  description: "View row results and error details for this bulk upload.",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BulkImportDetailsPage importId={id} />;
}
