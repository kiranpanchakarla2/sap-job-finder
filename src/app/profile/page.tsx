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
    const [p, c] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("candidate_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    profile = p.data;
    candidate = c.data;

    if (c.data?.id) {
      const { data: resume } = await supabase
        .from("candidate_resumes")
        .select("resume_name")
        .eq("candidate_id", c.data.id)
        .eq("is_primary", true)
        .maybeSingle();
      resumeFilename = resume?.resume_name ?? null;
    }
  }

  const [firstName, ...rest] = user.fullName.split(" ");

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
              id: "",
              user_id: user.id,
              first_name: firstName || user.fullName,
              last_name: rest.join(" ") || null,
              phone: null,
              avatar_url: null,
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
