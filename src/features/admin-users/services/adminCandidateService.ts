/**
 * Candidate Management Service for Super Admin Portal (Sprint 10C)
 * Real database-side search, filtering, sorting, pagination, and administrative actions.
 */

import { createClient } from "@/lib/supabase/client";
import type {
  AdminCandidateDetails,
  AdminCandidateListItem,
  CandidateDiscoverability,
  CandidateFilterState,
  CandidatePaginationState,
  CandidateSortField,
  CandidateSortOrder,
  CandidateSubscriptionDetails,
  CandidateSubscriptionStatus,
} from "../types/candidate.types";

/**
 * Calculates start and end timestamps for registration date filtering.
 */
function getDateRangeBounds(
  range: CandidateFilterState["registrationDate"],
  customStart?: string,
  customEnd?: string,
): { start?: string; end?: string } {
  const now = new Date();
  if (range === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return { start: start.toISOString(), end: now.toISOString() };
  }
  if (range === "7d") {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { start: start.toISOString(), end: now.toISOString() };
  }
  if (range === "30d") {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { start: start.toISOString(), end: now.toISOString() };
  }
  if (range === "custom" && customStart && customEnd) {
    return {
      start: new Date(customStart).toISOString(),
      end: new Date(customEnd).toISOString(),
    };
  }
  return {};
}

export type FetchCandidatesParams = {
  filters: CandidateFilterState;
  sortBy?: CandidateSortField;
  sortOrder?: CandidateSortOrder;
  page?: number;
  pageSize?: number;
};

export type FetchCandidatesResult = {
  data: AdminCandidateListItem[];
  pagination: CandidatePaginationState;
  error: string | null;
};

/**
 * Fetch candidates with server-side filters, search, and pagination.
 */
export async function fetchCandidates({
  filters,
  sortBy = "created_at",
  sortOrder = "desc",
  page = 1,
  pageSize = 20,
}: FetchCandidatesParams): Promise<FetchCandidatesResult> {
  const supabase = createClient();
  try {
    const offset = (page - 1) * pageSize;

    // Start building query on candidate_profiles
    let query = supabase
      .from("candidate_profiles")
      .select(
        `
        id,
        user_id,
        first_name,
        last_name,
        phone,
        profile_photo_url,
        avatar_url,
        headline,
        years_of_experience,
        total_experience,
        experience_band,
        location,
        current_city,
        current_state,
        country,
        discovery_status,
        is_searchable,
        status,
        profile_completion,
        sap_skills,
        preferred_sap_modules,
        module_experience,
        created_at,
        updated_at
      `,
        { count: "exact" },
      );

    // 1. Account Status Filter
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    // 2. Discoverability Filter
    if (filters.discoverability === "discoverable") {
      query = query.or("discovery_status.eq.open_to_opportunities,discovery_status.eq.available,is_searchable.eq.true");
    } else if (filters.discoverability === "not_discoverable") {
      query = query.eq("discovery_status", "not_available").eq("is_searchable", false);
    }

    // 3. SAP Module Filter
    if (filters.sapModule && filters.sapModule !== "all") {
      query = query.or(
        `sap_skills.cs.{${filters.sapModule}},preferred_sap_modules.cs.{${filters.sapModule}},headline.ilike.%${filters.sapModule}%`,
      );
    }

    // 4. Registration Date Filter
    const dateBounds = getDateRangeBounds(filters.registrationDate, filters.customStart, filters.customEnd);
    if (dateBounds.start) {
      query = query.gte("created_at", dateBounds.start);
    }
    if (dateBounds.end) {
      query = query.lte("created_at", dateBounds.end);
    }

    // 5. Search by candidate name or headline
    const trimmedSearch = filters.search.trim();
    if (trimmedSearch) {
      query = query.or(
        `first_name.ilike.%${trimmedSearch}%,last_name.ilike.%${trimmedSearch}%,headline.ilike.%${trimmedSearch}%`,
      );
    }

    // 6. Sorting
    if (sortBy === "full_name") {
      query = query.order("first_name", { ascending: sortOrder === "asc" });
    } else if (sortBy === "total_experience") {
      query = query.order("years_of_experience", { ascending: sortOrder === "asc" });
    } else {
      query = query.order("created_at", { ascending: sortOrder === "asc" });
    }

    // 7. Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data: rows, count, error } = await query;

    if (error) {
      return {
        data: [],
        pagination: { page, pageSize, totalItems: 0, totalPages: 0 },
        error: error.message,
      };
    }

    const totalItems = count ?? 0;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    if (!rows || rows.length === 0) {
      return {
        data: [],
        pagination: { page, pageSize, totalItems, totalPages },
        error: null,
      };
    }

    // Fetch associated auth profile details (emails & profile statuses)
    const userIds = rows.map((r) => r.user_id).filter(Boolean);
    const candidateIds = rows.map((r) => r.id);

    const [profilesRes, subsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, email, first_name, last_name, phone, status, avatar_url")
        .in("user_id", userIds),
      supabase
        .from("candidate_subscriptions")
        .select("candidate_id, plan_id, status, current_period_end")
        .in("candidate_id", candidateIds),
    ]);

    const profileMap = new Map<string, { email: string; name: string; status: string; avatarUrl: string | null }>();
    (profilesRes.data || []).forEach((p) => {
      const name = [p.first_name, p.last_name].filter(Boolean).join(" ");
      profileMap.set(p.user_id, {
        email: p.email || "",
        name,
        status: p.status || "active",
        avatarUrl: p.avatar_url || null,
      });
    });

    const subMap = new Map<string, { planId: string; status: CandidateSubscriptionStatus }>();
    (subsRes.data || []).forEach((s) => {
      subMap.set(s.candidate_id, {
        planId: s.plan_id,
        status: (s.status as CandidateSubscriptionStatus) || "active",
      });
    });

    // Map rows to AdminCandidateListItem
    const items: AdminCandidateListItem[] = rows.map((r) => {
      const p = profileMap.get(r.user_id);
      const sub = subMap.get(r.id);

      const cName = [r.first_name, r.last_name].filter(Boolean).join(" ").trim();
      const fullName = cName || p?.name || "Candidate";
      const email = p?.email || "—";
      const avatarUrl = r.avatar_url || r.profile_photo_url || p?.avatarUrl || null;

      // Consolidate SAP modules
      const rawModExp = r.module_experience;
      const modExpList: string[] = Array.isArray(rawModExp)
        ? rawModExp
            .map((item) => (item && typeof item === "object" && "module" in item ? String(item.module) : ""))
            .filter(Boolean)
        : [];

      const allModules: string[] = Array.from(
        new Set([...(r.sap_skills || []), ...(r.preferred_sap_modules || []), ...modExpList]),
      ).filter((m): m is string => Boolean(m));

      const loc =
        r.location ||
        [r.current_city, r.current_state, r.country].filter(Boolean).join(", ") ||
        null;

      const totalExp = Number(r.total_experience ?? r.years_of_experience) || 0;

      // Plan Name
      let planName = "Free";
      if (sub?.planId === "candidate_premium" || sub?.planId === "premium") {
        planName = "Candidate Premium";
      } else if (sub?.planId === "candidate_pro" || sub?.planId === "pro") {
        planName = "Candidate Pro";
      } else if (sub?.planId) {
        planName = sub.planId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      }

      // Subscription Status
      const subStatus: CandidateSubscriptionStatus = sub ? sub.status : "none";

      return {
        id: r.id,
        userId: r.user_id,
        fullName,
        email,
        phone: r.phone || null,
        avatarUrl,
        headline: r.headline || null,
        sapModules: allModules,
        totalExperience: totalExp,
        experienceBand: r.experience_band || (totalExp > 0 ? `${totalExp} Years` : null),
        location: loc,
        discoveryStatus: (r.discovery_status as CandidateDiscoverability) || "not_available",
        isSearchable: Boolean(r.is_searchable),
        subscriptionPlan: planName,
        subscriptionStatus: subStatus,
        accountStatus: (r.status as AdminCandidateListItem["accountStatus"]) || (p?.status as AdminCandidateListItem["accountStatus"]) || "active",
        profileCompletion: r.profile_completion || 0,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });

    // Client-side filtering for subscription if selected
    let finalItems = items;
    if (filters.subscription === "active") {
      finalItems = items.filter((i) => i.subscriptionStatus === "active");
    } else if (filters.subscription === "expired") {
      finalItems = items.filter((i) => i.subscriptionStatus === "expired" || i.subscriptionStatus === "past_due");
    } else if (filters.subscription === "none") {
      finalItems = items.filter((i) => i.subscriptionStatus === "none" || i.subscriptionPlan.toLowerCase() === "free");
    }

    return {
      data: finalItems,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: [],
      pagination: { page, pageSize, totalItems: 0, totalPages: 0 },
      error: err instanceof Error ? err.message : "Failed to fetch candidates",
    };
  }
}

/**
 * Fetch complete Candidate Details by candidate_profile.id.
 * Read-only inspection for Super Admin.
 */
export async function fetchCandidateById(
  candidateId: string,
): Promise<{ data: AdminCandidateDetails | null; error: string | null }> {
  const supabase = createClient();
  try {
    // 1. Candidate profile row
    const { data: cand, error: candError } = await supabase
      .from("candidate_profiles")
      .select("*")
      .eq("id", candidateId)
      .maybeSingle();

    if (candError) {
      return { data: null, error: candError.message };
    }
    if (!cand) {
      return { data: null, error: "Candidate not found" };
    }

    // 2. Fetch associated child tables and profiles in parallel
    const [
      profileRes,
      settingsRes,
      subRes,
      skillsRes,
      expRes,
      eduRes,
      certRes,
      resumeRes,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, user_id, email, first_name, last_name, phone, avatar_url, status, created_at, updated_at")
        .eq("user_id", cand.user_id)
        .maybeSingle(),
      supabase
        .from("candidate_settings")
        .select("privacy_preferences, notification_preferences, job_preferences")
        .eq("candidate_id", candidateId)
        .maybeSingle(),
      supabase
        .from("candidate_subscriptions")
        .select(
          `
          id,
          plan_id,
          status,
          billing_cycle,
          price_monthly,
          currency,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          candidate_plans (
            name,
            tagline,
            price_monthly
          )
        `,
        )
        .eq("candidate_id", candidateId)
        .maybeSingle(),
      supabase
        .from("candidate_skills")
        .select("experience_years, proficiency, skills(name)")
        .eq("candidate_id", candidateId),
      supabase
        .from("candidate_experience")
        .select("id, company, designation, employment_type, location, start_date, end_date, currently_working, description")
        .eq("candidate_id", candidateId)
        .order("start_date", { ascending: false }),
      supabase
        .from("candidate_education")
        .select("id, college, degree, field_of_study, start_date, end_date, grade")
        .eq("candidate_id", candidateId)
        .order("start_date", { ascending: false }),
      supabase
        .from("candidate_certifications")
        .select("id, certificate_name, issuer, issued_date, expiry_date, credential_id, status")
        .eq("candidate_id", candidateId)
        .order("issued_date", { ascending: false }),
      supabase
        .from("candidate_resumes")
        .select("id, resume_name, resume_url, original_file_name, is_primary, created_at")
        .eq("candidate_id", candidateId)
        .order("is_primary", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const p = profileRes.data;
    const fullName =
      [cand.first_name, cand.last_name].filter(Boolean).join(" ") ||
      [p?.first_name, p?.last_name].filter(Boolean).join(" ") ||
      "Candidate";

    const email = p?.email || "—";
    const phone = cand.phone || p?.phone || null;
    const avatarUrl = cand.avatar_url || cand.profile_photo_url || p?.avatar_url || null;

    // Subscription parsing
    let subscription: CandidateSubscriptionDetails | null = null;
    if (subRes.data) {
      const s = subRes.data;
      const planInfo = Array.isArray(s.candidate_plans) ? s.candidate_plans[0] : s.candidate_plans;
      const planName = planInfo?.name || s.plan_id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const now = Date.now();
      const endTs = new Date(s.current_period_end).getTime();
      const daysRemaining = Math.max(0, Math.ceil((endTs - now) / (1000 * 60 * 60 * 24)));

      subscription = {
        planId: s.plan_id,
        planName,
        tagline: planInfo?.tagline,
        status: s.status,
        billingCycle: s.billing_cycle || "monthly",
        priceMonthly: Number(s.price_monthly) || Number(planInfo?.price_monthly) || 0,
        currency: s.currency || "INR",
        currentPeriodStart: s.current_period_start,
        currentPeriodEnd: s.current_period_end,
        daysRemaining,
        cancelAtPeriodEnd: Boolean(s.cancel_at_period_end),
      };
    }

    // Skills parsing
    const skillsList = (skillsRes.data || []).map((sk) => {
      const skillObj = Array.isArray(sk.skills) ? sk.skills[0] : sk.skills;
      return {
        name: skillObj?.name || "Skill",
        experienceYears: sk.experience_years,
        proficiency: sk.proficiency,
      };
    });

    // Privacy preferences parsing
    const privacy = (settingsRes.data?.privacy_preferences as {
      profileVisibility?: "public" | "private";
      showInTalentSearch?: boolean;
      showResumeToRecruiters?: boolean;
    } | null) || {
      profileVisibility: "public",
      showInTalentSearch: true,
      showResumeToRecruiters: true,
    };

    // Module experience array
    const rawModExp = cand.module_experience;
    const moduleExperience: Array<{ module: string; years: number | string }> = Array.isArray(rawModExp)
      ? rawModExp.map((m) => {
          if (m && typeof m === "object") {
            const obj = m as Record<string, unknown>;
            return {
              module: String(obj.module || "SAP"),
              years: (obj.years as number | string) ?? 1,
            };
          }
          return { module: "SAP", years: 1 };
        })
      : [];

    const details: AdminCandidateDetails = {
      id: cand.id,
      userId: cand.user_id,
      fullName,
      firstName: cand.first_name || p?.first_name || null,
      lastName: cand.last_name || p?.last_name || null,
      email,
      phone,
      avatarUrl,
      headline: cand.headline || null,
      aboutMe: cand.about_me || cand.professional_summary || null,
      location: cand.location || null,
      currentCity: cand.current_city || null,
      currentState: cand.current_state || null,
      country: cand.country || null,
      currentCompany: cand.current_company || null,
      currentJobRole: cand.current_job_role || null,
      employmentStatus: cand.employment_status || null,
      totalExperience: Number(cand.total_experience ?? cand.years_of_experience) || 0,
      experienceBand: cand.experience_band || null,
      sapExperienceBand: cand.sap_experience_band || null,
      currentCtc: cand.current_ctc ? Number(cand.current_ctc) : null,
      expectedCtc: cand.expected_ctc ? Number(cand.expected_ctc) : null,
      preferredSalaryRange: cand.preferred_salary_range || null,
      noticePeriod: cand.notice_period || null,
      preferredLocations: cand.preferred_locations || [],
      preferredJobRoles: cand.preferred_job_roles || [],
      preferredSapModules: cand.preferred_sap_modules || [],
      sapSkills: cand.sap_skills || [],
      skillsList,
      moduleExperience,
      certifications: (certRes.data || []).map((c) => ({
        id: c.id,
        name: c.certificate_name,
        issuingOrganization: c.issuer || "—",
        issueDate: c.issued_date || "",
        expirationDate: c.expiry_date,
        credentialId: c.credential_id,
        status: c.status,
      })),
      workExperience: (expRes.data || []).map((e) => ({
        id: e.id,
        companyName: e.company,
        designation: e.designation,
        employmentType: e.employment_type,
        location: e.location,
        startDate: e.start_date,
        endDate: e.end_date,
        isCurrent: Boolean(e.currently_working),
        description: e.description,
      })),
      education: (eduRes.data || []).map((ed) => ({
        id: ed.id,
        institution: ed.college,
        degree: ed.degree,
        fieldOfStudy: ed.field_of_study,
        startDate: ed.start_date || "",
        endDate: ed.end_date,
        grade: ed.grade,
      })),
      resumeUrl: resumeRes.data?.resume_url || cand.resume_url || null,
      resumeFileName: resumeRes.data?.original_file_name || resumeRes.data?.resume_name || cand.resume_file_name || null,
      portfolioUrl: cand.portfolio_url || null,
      linkedinUrl: cand.linkedin_url || null,
      githubUrl: cand.github_url || null,
      profileCompletion: cand.profile_completion || 0,
      discoveryStatus: (cand.discovery_status as CandidateDiscoverability) || "not_available",
      isSearchable: Boolean(cand.is_searchable),
      privacyPreferences: {
        profileVisibility: privacy.profileVisibility || "public",
        showInTalentSearch: privacy.showInTalentSearch ?? true,
        showResumeToRecruiters: privacy.showResumeToRecruiters ?? true,
      },
      accountStatus: (cand.status as AdminCandidateDetails["accountStatus"]) || (p?.status as AdminCandidateDetails["accountStatus"]) || "active",
      subscription,
      createdAt: cand.created_at,
      updatedAt: cand.updated_at,
    };

    return { data: details, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to fetch candidate details",
    };
  }
}

/**
 * Suspend a candidate account (Super Admin action).
 */
export async function suspendCandidate(
  candidateId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc("admin_suspend_candidate", {
      p_candidate_id: candidateId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data && typeof data === "object" && "success" in data && !data.success) {
      return { success: false, error: (data as { error?: string }).error || "Failed to suspend candidate" };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to suspend candidate",
    };
  }
}

/**
 * Reactivate a suspended candidate account (Super Admin action).
 */
export async function reactivateCandidate(
  candidateId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc("admin_reactivate_candidate", {
      p_candidate_id: candidateId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data && typeof data === "object" && "success" in data && !data.success) {
      return { success: false, error: (data as { error?: string }).error || "Failed to reactivate candidate" };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reactivate candidate",
    };
  }
}
