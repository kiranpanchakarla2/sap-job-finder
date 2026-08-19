/**
 * Employer Management Service for Super Admin Portal (Sprint 10C)
 * Real database queries for employer list, filtering, company users, jobs summary, and admin actions.
 */

import { createClient } from "@/lib/supabase/client";
import type {
  AdminEmployerDetails,
  AdminEmployerListItem,
  CompanyUserItem,
  EmployerCompanyUserRole,
  EmployerFilterState,
  EmployerJobPreviewItem,
  EmployerJobSummary,
  EmployerPaginationState,
  EmployerSortField,
  EmployerSortOrder,
  EmployerSubscriptionDetails,
  EmployerSubscriptionStatus,
} from "../types/employer.types";

function getDateRangeBounds(
  range: EmployerFilterState["registrationDate"],
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

export type FetchEmployersParams = {
  filters: EmployerFilterState;
  sortBy?: EmployerSortField;
  sortOrder?: EmployerSortOrder;
  page?: number;
  pageSize?: number;
};

export type FetchEmployersResult = {
  data: AdminEmployerListItem[];
  pagination: EmployerPaginationState;
  error: string | null;
};

/**
 * Fetch employers with server-side filters, search, and pagination.
 */
export async function fetchEmployers({
  filters,
  sortBy = "created_at",
  sortOrder = "desc",
  page = 1,
  pageSize = 20,
}: FetchEmployersParams): Promise<FetchEmployersResult> {
  const supabase = createClient();
  try {
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("company_profiles")
      .select(
        `
        id,
        user_id,
        company_name,
        logo_url,
        website,
        industry,
        company_size,
        country,
        state,
        city,
        address,
        about,
        recruiter_name,
        designation,
        work_email,
        phone,
        setup_complete,
        status,
        is_verified,
        created_at,
        updated_at
      `,
        { count: "exact" },
      );

    // 1. Account Status Filter
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    // 2. Verification Filter
    if (filters.verification === "verified") {
      query = query.eq("is_verified", true);
    } else if (filters.verification === "unverified") {
      query = query.eq("is_verified", false);
    }

    // 3. Date Range Filter
    const dateBounds = getDateRangeBounds(filters.registrationDate, filters.customStart, filters.customEnd);
    if (dateBounds.start) {
      query = query.gte("created_at", dateBounds.start);
    }
    if (dateBounds.end) {
      query = query.lte("created_at", dateBounds.end);
    }

    // 4. Search by company name or admin email
    const trimmedSearch = filters.search.trim();
    if (trimmedSearch) {
      query = query.or(
        `company_name.ilike.%${trimmedSearch}%,work_email.ilike.%${trimmedSearch}%,recruiter_name.ilike.%${trimmedSearch}%`,
      );
    }

    // 5. Sorting
    if (sortBy === "company_name") {
      query = query.order("company_name", { ascending: sortOrder === "asc" });
    } else {
      query = query.order("created_at", { ascending: sortOrder === "asc" });
    }

    // 6. Pagination
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

    const companyIds = rows.map((r) => r.id);
    const userIds = rows.map((r) => r.user_id).filter(Boolean);

    // Fetch jobs counts, subscriptions, and profile emails in parallel
    const [jobsRes, subsRes, profilesRes] = await Promise.all([
      supabase
        .from("jobs")
        .select("id, company_id, status")
        .in("company_id", companyIds),
      supabase
        .from("subscriptions")
        .select("company_id, plan_id, status, current_period_end")
        .in("company_id", companyIds),
      supabase
        .from("profiles")
        .select("user_id, email, first_name, last_name, status")
        .in("user_id", userIds),
    ]);

    // Aggregate job counts per company
    const activeJobsMap = new Map<string, number>();
    const totalJobsMap = new Map<string, number>();
    (jobsRes.data || []).forEach((j) => {
      totalJobsMap.set(j.company_id, (totalJobsMap.get(j.company_id) || 0) + 1);
      if (j.status === "active") {
        activeJobsMap.set(j.company_id, (activeJobsMap.get(j.company_id) || 0) + 1);
      }
    });

    // Map subscriptions per company
    const subMap = new Map<string, { planId: string; status: EmployerSubscriptionStatus }>();
    (subsRes.data || []).forEach((s) => {
      subMap.set(s.company_id, {
        planId: s.plan_id,
        status: (s.status as EmployerSubscriptionStatus) || "active",
      });
    });

    // Map profiles for fallback admin email / name
    const profileMap = new Map<string, { email: string; name: string; status: string }>();
    (profilesRes.data || []).forEach((p) => {
      const name = [p.first_name, p.last_name].filter(Boolean).join(" ");
      profileMap.set(p.user_id, {
        email: p.email || "",
        name,
        status: p.status || "active",
      });
    });

    const items: AdminEmployerListItem[] = rows.map((r) => {
      const p = profileMap.get(r.user_id);
      const sub = subMap.get(r.id);

      const adminName = r.recruiter_name || p?.name || "Company Admin";
      const adminEmail = r.work_email || p?.email || "—";
      const location = [r.city, r.state, r.country].filter(Boolean).join(", ") || null;

      let planName = "Free";
      if (sub?.planId === "business") {
        planName = "Business";
      } else if (sub?.planId === "pro") {
        planName = "Pro";
      } else if (sub?.planId) {
        planName = sub.planId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      }

      const subStatus: EmployerSubscriptionStatus = sub ? sub.status : "none";
      const activeJobsCount = activeJobsMap.get(r.id) || 0;
      const totalJobsCount = totalJobsMap.get(r.id) || 0;

      return {
        id: r.id,
        userId: r.user_id,
        companyName: r.company_name || "Company",
        logoUrl: r.logo_url || null,
        adminEmail,
        adminName,
        location,
        industry: r.industry || null,
        companySize: r.company_size || null,
        subscriptionPlan: planName,
        subscriptionStatus: subStatus,
        accountStatus: (r.status as AdminEmployerListItem["accountStatus"]) || (p?.status as AdminEmployerListItem["accountStatus"]) || "active",
        isVerified: Boolean(r.is_verified),
        activeJobsCount,
        totalJobsCount,
        setupComplete: Boolean(r.setup_complete),
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

    if (sortBy === "active_jobs") {
      finalItems.sort((a, b) =>
        sortOrder === "asc"
          ? a.activeJobsCount - b.activeJobsCount
          : b.activeJobsCount - a.activeJobsCount,
      );
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
      error: err instanceof Error ? err.message : "Failed to fetch employers",
    };
  }
}

/**
 * Fetch complete Employer Details by company_profiles.id.
 */
export async function fetchEmployerById(
  companyId: string,
): Promise<{ data: AdminEmployerDetails | null; error: string | null }> {
  const supabase = createClient();
  try {
    // 1. Company profile
    const { data: comp, error: compError } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("id", companyId)
      .maybeSingle();

    if (compError) {
      return { data: null, error: compError.message };
    }
    if (!comp) {
      return { data: null, error: "Company not found" };
    }

    // 2. Fetch associated accounts, jobs, subscription, and profiles in parallel
    const [teamRes, jobsRes, subRes, adminProfileRes] = await Promise.all([
      supabase
        .from("employer_accounts")
        .select("id, user_id, role, status, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true }),
      supabase
        .from("jobs")
        .select("id, title, sap_module, location, employment_type, status, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("subscriptions")
        .select(
          `
          id,
          plan_id,
          status,
          billing_cycle,
          current_period_start,
          current_period_end,
          renewal_date,
          next_billing_date,
          subscription_plans (
            name,
            description,
            price_monthly
          )
        `,
        )
        .eq("company_id", companyId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("user_id, email, first_name, last_name, phone, status")
        .eq("user_id", comp.user_id)
        .maybeSingle(),
    ]);

    // Fetch names and emails for all team user IDs
    const teamUserIds = (teamRes.data || []).map((t) => t.user_id).filter(Boolean);
    const { data: teamProfiles } = await supabase
      .from("profiles")
      .select("user_id, email, first_name, last_name")
      .in("user_id", teamUserIds);

    const teamProfileMap = new Map<string, { name: string; email: string }>();
    (teamProfiles || []).forEach((tp) => {
      const name = [tp.first_name, tp.last_name].filter(Boolean).join(" ");
      teamProfileMap.set(tp.user_id, {
        name: name || "Team Member",
        email: tp.email || "—",
      });
    });

    const companyUsers: CompanyUserItem[] = (teamRes.data || []).map((t) => {
      const tp = teamProfileMap.get(t.user_id);
      return {
        id: t.id,
        userId: t.user_id,
        name: tp?.name || "Team Member",
        email: tp?.email || "—",
        role: t.role as EmployerCompanyUserRole,
        status: t.status as "active" | "invited" | "suspended",
        joinedAt: t.created_at,
      };
    });

    // Job summary calculation
    const allJobs = jobsRes.data || [];
    let activeCount = 0;
    let draftCount = 0;
    let closedCount = 0;
    let expiredCount = 0;

    allJobs.forEach((j) => {
      const st = (j.status || "").toLowerCase();
      if (st === "published" || st === "active") activeCount++;
      else if (st === "draft") draftCount++;
      else if (st === "closed") closedCount++;
      else if (st === "expired") expiredCount++;
    });

    const recentJobs: EmployerJobPreviewItem[] = allJobs.slice(0, 5).map((j) => ({
      id: j.id,
      title: j.title,
      sapModule: j.sap_module || "SAP",
      location: j.location || "Remote",
      employmentType: j.employment_type || "Full-time",
      status: j.status,
      createdAt: j.created_at,
    }));

    const jobSummary: EmployerJobSummary = {
      totalJobs: allJobs.length,
      activeJobs: activeCount,
      draftJobs: draftCount,
      closedJobs: closedCount,
      expiredJobs: expiredCount,
      recentJobs,
    };

    // Subscription parsing
    let subscription: EmployerSubscriptionDetails | null = null;
    if (subRes.data) {
      const s = subRes.data;
      const planInfo = Array.isArray(s.subscription_plans) ? s.subscription_plans[0] : s.subscription_plans;
      const planName = planInfo?.name || s.plan_id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const now = Date.now();
      const endTs = new Date(s.current_period_end).getTime();
      const daysRemaining = Math.max(0, Math.ceil((endTs - now) / (1000 * 60 * 60 * 24)));

      subscription = {
        planId: s.plan_id,
        planName,
        tagline: planInfo?.description,
        status: s.status,
        billingCycle: s.billing_cycle || "monthly",
        priceMonthly: Number(planInfo?.price_monthly) || 0,
        currentPeriodStart: s.current_period_start,
        currentPeriodEnd: s.current_period_end,
        renewalDate: s.renewal_date,
        nextBillingDate: s.next_billing_date,
        daysRemaining,
      };
    }

    const p = adminProfileRes.data;
    const recruiterName = comp.recruiter_name || [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "Company Admin";
    const workEmail = comp.work_email || p?.email || "—";
    const phone = comp.phone || p?.phone || "—";
    const location = [comp.city, comp.state, comp.country].filter(Boolean).join(", ") || null;

    const details: AdminEmployerDetails = {
      id: comp.id,
      userId: comp.user_id,
      companyName: comp.company_name || "Company",
      logoUrl: comp.logo_url || null,
      website: comp.website || null,
      industry: comp.industry || null,
      companySize: comp.company_size || null,
      country: comp.country || null,
      state: comp.state || null,
      city: comp.city || null,
      address: comp.address || null,
      location,
      about: comp.about || null,
      recruiterName,
      designation: comp.designation || "Recruiter",
      workEmail,
      phone,
      setupComplete: Boolean(comp.setup_complete),
      isVerified: Boolean(comp.is_verified),
      accountStatus: (comp.status as AdminEmployerDetails["accountStatus"]) || (p?.status as AdminEmployerDetails["accountStatus"]) || "active",
      companyUsers,
      jobSummary,
      subscription,
      createdAt: comp.created_at,
      updatedAt: comp.updated_at,
    };

    return { data: details, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to fetch employer details",
    };
  }
}

/**
 * Suspend an employer account (Super Admin action).
 */
export async function suspendEmployer(
  companyId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc("admin_suspend_employer", {
      p_company_id: companyId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data && typeof data === "object" && "success" in data && !data.success) {
      return { success: false, error: (data as { error?: string }).error || "Failed to suspend employer" };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to suspend employer",
    };
  }
}

/**
 * Reactivate an employer account (Super Admin action).
 */
export async function reactivateEmployer(
  companyId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc("admin_reactivate_employer", {
      p_company_id: companyId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data && typeof data === "object" && "success" in data && !data.success) {
      return { success: false, error: (data as { error?: string }).error || "Failed to reactivate employer" };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reactivate employer",
    };
  }
}

/**
 * Verify or unverify an employer organization (Super Admin action).
 */
export async function setEmployerVerification(
  companyId: string,
  verified: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc("admin_verify_employer", {
      p_company_id: companyId,
      p_verified: verified,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data && typeof data === "object" && "success" in data && !data.success) {
      return { success: false, error: (data as { error?: string }).error || "Failed to update verification status" };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update verification status",
    };
  }
}
