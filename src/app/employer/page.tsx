import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { PublicLayout } from "@/layouts/PublicLayout";

/**
 * Employer landing page — destination for explicit logout.
 * Session expiration always redirects to /employer/login instead.
 */
export default async function EmployerLandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.role === "employer" || profile?.role === "admin") {
      redirect("/employer/dashboard");
    }
  }

  return (
    <PublicLayout>
      <main className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-16">
        <div className="w-full max-w-lg text-center">
          <p className="text-sm font-medium text-primary">SAPJobsFinder</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text">
            Employer Portal
          </h1>
          <p className="mt-3 text-muted">
            Post SAP roles, manage applicants, and discover talent for your
            company.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/employer/login">Sign in</Button>
            <Button href="/employer/register" variant="secondary">
              Create employer account
            </Button>
          </div>
          <p className="mt-8 text-sm text-muted">
            Looking for a job?{" "}
            <Link href="/login/candidate" className="font-medium text-primary hover:underline">
              Candidate sign in
            </Link>
          </p>
        </div>
      </main>
    </PublicLayout>
  );
}
