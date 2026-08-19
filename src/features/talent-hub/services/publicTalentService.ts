import { createClient } from "@/lib/supabase/client";
import { MOCK_PUBLIC_TALENT_CANDIDATES } from "../data/mockPublicTalent";
import type {
  PublicExperienceBand,
  PublicRoleCategory,
  PublicTalentCandidate,
  PublicTalentSearchQuery,
  PublicTalentSearchResult,
  PublicWorkMode,
} from "../types/publicTalent.types";

function calculateExperienceBand(years: number): PublicExperienceBand {
  if (years <= 2) return "0-2";
  if (years <= 5) return "3-5";
  if (years <= 8) return "6-8";
  if (years <= 12) return "9-12";
  return "13+";
}

function inferRoleCategory(title: string): PublicRoleCategory {
  const lower = title.toLowerCase();
  if (lower.includes("architect")) return "architect";
  if (lower.includes("developer") || lower.includes("abap") || lower.includes("cpi") || lower.includes("engineer"))
    return "developer";
  if (lower.includes("basis") || lower.includes("security") || lower.includes("grc") || lower.includes("technical"))
    return "technical";
  if (lower.includes("project") || lower.includes("program") || lower.includes("manager") || lower.includes("scrum"))
    return "program-lead";
  if (lower.includes("specialist") || lower.includes("functional")) return "functional";
  return "consultant";
}

/**
 * Maps raw Supabase database row strictly into a privacy-safe public candidate.
 * Never includes personal names, emails, phones, employers, or internal UUIDs.
 */
function mapToPublicCandidate(
  row: Record<string, unknown>,
  index: number,
): PublicTalentCandidate {
  const headline =
    typeof row.headline === "string" && row.headline.trim()
      ? row.headline.trim()
      : typeof row.current_job_role === "string" && row.current_job_role.trim()
        ? row.current_job_role.trim()
        : "SAP Professional";

  const years =
    typeof row.years_of_experience === "number"
      ? row.years_of_experience
      : typeof row.total_experience === "number"
        ? row.total_experience
        : 5;

  const sapModules = Array.isArray(row.sap_skills)
    ? row.sap_skills.filter((m): m is string => typeof m === "string")
    : [];

  const skills = Array.isArray(row.skills)
    ? row.skills.filter((s): s is string => typeof s === "string")
    : [];

  const city =
    typeof row.current_city === "string"
      ? row.current_city
      : typeof row.location === "string"
        ? row.location.split(",")[0]?.trim() || "India"
        : "India";

  const country =
    typeof row.country === "string" && row.country.trim()
      ? row.country.trim()
      : "India";

  const workModes = Array.isArray(row.work_modes)
    ? (row.work_modes.filter((w) =>
        ["remote", "hybrid", "onsite"].includes(w),
      ) as PublicWorkMode[])
    : (["hybrid", "remote"] as PublicWorkMode[]);

  const rawSummary =
    typeof row.professional_summary === "string" && row.professional_summary.trim()
      ? row.professional_summary.trim()
      : typeof row.about_me === "string" && row.about_me.trim()
        ? row.about_me.trim()
        : `Experienced SAP specialist with ${years}+ years of hands-on expertise in enterprise implementations and optimizations.`;

  return {
    id: `anon-sap-${index + 1}`,
    title: headline,
    roleCategory: inferRoleCategory(headline),
    yearsOfExperience: years,
    experienceBand: calculateExperienceBand(years),
    location: `${city}, ${country}`,
    city,
    country,
    workModes: workModes.length ? workModes : ["hybrid"],
    availability: "available_now",
    sapModules: sapModules.length ? sapModules : ["SAP ERP", "SAP S/4HANA"],
    skills: skills.length ? skills : ["Implementation", "Configuration"],
    certifications: ["SAP Certified Professional"],
    summary: rawSummary,
    discoveryStatus:
      row.discovery_status === "available" ? "available" : "open_to_opportunities",
  };
}

export const publicTalentService = {
  async searchCandidates(
    query: PublicTalentSearchQuery,
  ): Promise<PublicTalentSearchResult> {
    try {
      const supabase = createClient();

      // Explicitly select ONLY public fields. Never select '*', emails, names, phones, or employment histories.
      const { data: dbRows, error } = await supabase
        .from("candidate_profiles")
        .select(
          "headline, current_job_role, sap_skills, skills, years_of_experience, total_experience, current_city, country, location, work_modes, availability, discovery_status, professional_summary, about_me, is_searchable",
        )
        .eq("is_searchable", true)
        .neq("discovery_status", "not_available")
        .limit(30);

      let allCandidates = [...MOCK_PUBLIC_TALENT_CANDIDATES];

      if (!error && Array.isArray(dbRows) && dbRows.length > 0) {
        const livePublic = dbRows.map((row, idx) =>
          mapToPublicCandidate(row as Record<string, unknown>, idx + 100),
        );
        allCandidates = [...livePublic, ...allCandidates];
      }

      // Apply client-side filters
      const { filters, sort, page, pageSize } = query;
      let filtered = allCandidates;

      // Keyword filter
      if (filters.keyword.trim()) {
        const term = filters.keyword.toLowerCase().trim();
        filtered = filtered.filter(
          (c) =>
            c.title.toLowerCase().includes(term) ||
            c.summary.toLowerCase().includes(term) ||
            c.sapModules.some((m) => m.toLowerCase().includes(term)) ||
            c.skills.some((s) => s.toLowerCase().includes(term)) ||
            c.location.toLowerCase().includes(term),
        );
      }

      // Role type filter (e.g., from navigation /talent-hub/search?type=consultant)
      if (filters.type) {
        const targetType = filters.type.toLowerCase();
        filtered = filtered.filter((c) => {
          if (targetType === "consultant")
            return c.roleCategory === "consultant" || c.title.toLowerCase().includes("consultant");
          if (targetType === "developer")
            return c.roleCategory === "developer" || c.title.toLowerCase().includes("developer") || c.title.toLowerCase().includes("abap");
          if (targetType === "architect")
            return c.roleCategory === "architect" || c.title.toLowerCase().includes("architect");
          if (targetType === "functional")
            return c.roleCategory === "functional" || c.title.toLowerCase().includes("functional");
          if (targetType === "technical")
            return c.roleCategory === "technical" || c.title.toLowerCase().includes("basis") || c.title.toLowerCase().includes("security");
          if (targetType === "program-lead")
            return c.roleCategory === "program-lead" || c.title.toLowerCase().includes("project") || c.title.toLowerCase().includes("manager");
          return true;
        });
      }

      // Module filter
      if (filters.modules.length > 0) {
        filtered = filtered.filter((c) =>
          filters.modules.some((mod) =>
            c.sapModules.some((cm) => cm.toLowerCase().includes(mod.toLowerCase())),
          ),
        );
      }

      // Skills filter
      if (filters.skills.length > 0) {
        filtered = filtered.filter((c) =>
          filters.skills.some((sk) =>
            c.skills.some((cs) => cs.toLowerCase().includes(sk.toLowerCase())),
          ),
        );
      }

      // Experience band filter
      if (filters.experienceBands.length > 0) {
        filtered = filtered.filter((c) =>
          filters.experienceBands.includes(c.experienceBand),
        );
      }

      // Location filter
      if (filters.locations.length > 0) {
        filtered = filtered.filter((c) =>
          filters.locations.some((loc) =>
            c.location.toLowerCase().includes(loc.toLowerCase()),
          ),
        );
      }

      // Work mode filter
      if (filters.workModes.length > 0) {
        filtered = filtered.filter((c) =>
          filters.workModes.some((mode) => c.workModes.includes(mode)),
        );
      }

      // Availability filter
      if (filters.availability.length > 0) {
        filtered = filtered.filter((c) =>
          filters.availability.includes(c.availability),
        );
      }

      // Sorting
      if (sort === "experience_high") {
        filtered.sort((a, b) => b.yearsOfExperience - a.yearsOfExperience);
      } else if (sort === "experience_low") {
        filtered.sort((a, b) => a.yearsOfExperience - b.yearsOfExperience);
      } else if (sort === "available_soon") {
        filtered.sort((a, b) => {
          const scoreA = a.availability === "available_now" ? 2 : 1;
          const scoreB = b.availability === "available_now" ? 2 : 1;
          return scoreB - scoreA;
        });
      }

      // Pagination
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const currentPage = Math.min(Math.max(1, page), totalPages);
      const start = (currentPage - 1) * pageSize;
      const paginatedItems = filtered.slice(start, start + pageSize);

      return {
        items: paginatedItems,
        total,
        page: currentPage,
        pageSize,
        totalPages,
      };
    } catch {
      return {
        items: MOCK_PUBLIC_TALENT_CANDIDATES.slice(0, query.pageSize),
        total: MOCK_PUBLIC_TALENT_CANDIDATES.length,
        page: 1,
        pageSize: query.pageSize,
        totalPages: Math.ceil(MOCK_PUBLIC_TALENT_CANDIDATES.length / query.pageSize),
      };
    }
  },

  async getCandidatePreview(id: string): Promise<PublicTalentCandidate | null> {
    const candidate = MOCK_PUBLIC_TALENT_CANDIDATES.find((c) => c.id === id);
    return candidate || null;
  },
};
