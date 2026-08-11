import { CandidateProfilePage } from "@/features/employer-talent-search";

export default async function Page({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  return <CandidateProfilePage candidateId={candidateId} />;
}
