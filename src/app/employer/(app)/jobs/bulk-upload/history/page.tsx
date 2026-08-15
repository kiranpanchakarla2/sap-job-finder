import { BulkImportHistoryPage } from "@/features/employer-jobs/pages/BulkImportHistoryPage";

export const metadata = {
  title: "Bulk Upload History | Employer Portal | SAP Jobs Finder",
  description: "View previous Excel uploads and their import results.",
};

export default function Page() {
  return <BulkImportHistoryPage />;
}
