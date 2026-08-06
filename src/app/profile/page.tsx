import { AppShell } from "@/components/layout/AppShell";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { requireCandidateUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { tryGetSupabaseEnv } from "@/lib/supabase/env";

type SearchParams = Promise<{ tab?: string }>;

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCandidateUser("/profile");
  const params = await searchParams;

  let profile = null;
  let candidate = null;
  let resumeFilename: string | null = null;

  if (tryGetSupabaseEnv()) {
    const supabase = await createClient();
    const [p, c, r] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("candidate_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("resumes").select("filename").eq("user_id", user.id).maybeSingle(),
    ]);
    profile = p.data;
    candidate = c.data;
    resumeFilename = r.data?.filename ?? null;
  }

  return (
    <AppShell user={user}>
      <h1 className="text-2xl font-bold tracking-tight text-text">My Profile</h1>
      <p className="mt-1 text-sm text-muted">
        Keep your SAP experience, skills, and resume up to date.
      </p>
      <div className="mt-6">
        <ProfileForm
          userId={user.id}
          profile={
            profile ?? {
              id: user.id,
              full_name: user.fullName,
              phone: null,
              location: null,
              headline: null,
              role: user.role,
            }
          }
          candidate={candidate}
          resumeFilename={resumeFilename}
          initialTab={params.tab}
        />
      </div>
    </AppShell>
  );
}
