import { createClient } from "@/lib/supabase/client";
import {
  getCompanyById,
  mockCompanies,
  type MockCompany,
} from "@/lib/mock-data";

export async function listCompanies(): Promise<MockCompany[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("employer_profiles")
      .select("id, company_name, company_logo_url, about_company, website, headquarters")
      .order("company_name");

    if (error || !data?.length) return mockCompanies;

    return data.map((row) => ({
      id: row.id,
      name: row.company_name,
      logo: row.company_logo_url ?? row.company_name?.[0] ?? "C",
      logoColor: "#6366F1",
      description: row.about_company ?? "",
      website: row.website ?? "#",
      location: row.headquarters ?? "",
      openRoles: 0,
    }));
  } catch {
    return mockCompanies;
  }
}

export async function getCompany(id: string): Promise<MockCompany | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("employer_profiles")
      .select("id, company_name, company_logo_url, about_company, website, headquarters")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return getCompanyById(id) ?? null;

    return {
      id: data.id,
      name: data.company_name,
      logo: data.company_logo_url ?? data.company_name?.[0] ?? "C",
      logoColor: "#6366F1",
      description: data.about_company ?? "",
      website: data.website ?? "#",
      location: data.headquarters ?? "",
      openRoles: 0,
    };
  } catch {
    return getCompanyById(id) ?? null;
  }
}
