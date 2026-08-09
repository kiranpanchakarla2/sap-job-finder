import { createClient } from "@/lib/supabase/client";

export type EmployerProfileRow = {
  id: string;
  user_id: string;
  company_name: string;
  company_logo_url: string | null;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  headquarters: string | null;
  about_company: string | null;
  linkedin_url: string | null;
  is_verified: boolean;
};

export async function getEmployerProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("employer_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return { data: data as EmployerProfileRow | null, error };
}

export async function updateEmployerProfile(
  userId: string,
  values: Partial<
    Pick<
      EmployerProfileRow,
      | "company_name"
      | "company_logo_url"
      | "website"
      | "industry"
      | "company_size"
      | "headquarters"
      | "about_company"
      | "linkedin_url"
    >
  >,
) {
  const supabase = createClient();
  return supabase.from("employer_profiles").update(values).eq("user_id", userId);
}
