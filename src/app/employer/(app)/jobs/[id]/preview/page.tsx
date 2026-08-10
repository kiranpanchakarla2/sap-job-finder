import { JobPreviewPage } from "@/features/employer-jobs";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JobPreviewPage jobId={id} />;
}
