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
      .from("companies")
      .select("id, name, logo, description, website, location")
      .order("name");

    if (error || !data?.length) return mockCompanies;

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      logo: row.logo ?? row.name?.[0] ?? "C",
      logoColor: "#6366F1",
      description: row.description ?? "",
      website: row.website ?? "#",
      location: row.location ?? "",
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
      .from("companies")
      .select("id, name, logo, description, website, location")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return getCompanyById(id) ?? null;

    return {
      id: data.id,
      name: data.name,
      logo: data.logo ?? data.name?.[0] ?? "C",
      logoColor: "#6366F1",
      description: data.description ?? "",
      website: data.website ?? "#",
      location: data.location ?? "",
      openRoles: 0,
    };
  } catch {
    return getCompanyById(id) ?? null;
  }
}
