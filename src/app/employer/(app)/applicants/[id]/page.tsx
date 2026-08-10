import { ApplicantDetailsPage } from "@/features/employer-applicants";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ApplicantDetailsPage applicationId={id} />;
}
