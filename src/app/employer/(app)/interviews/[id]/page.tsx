import { InterviewDetailsPage } from "@/features/employer-interviews";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InterviewDetailsPage interviewId={id} />;
}
