/**
 * Employer Subscription Plan Management Service (Sprint 10D)
 * Super Admin operations for Employer plan definitions in `public.subscription_plans`.
 */

import { createClient } from "@/lib/supabase/client";
import type {
  AdminEmployerPlan,
  DurationUnit,
  EmployerPlanFormData,
  EmployerPlanLimits,
  PlanCurrency,
  PlanFilterState,
  PlanSortField,
  PlanSortOrder,
} from "../types/plan.types";

/**
 * Fetch employer plans with filtering, search, sorting, and live subscription usage counts.
 */
export async function fetchEmployerPlans(params: {
  filters?: PlanFilterState;
  sortBy?: PlanSortField;
  sortOrder?: PlanSortOrder;
} = {}): Promise<{ data: AdminEmployerPlan[]; error: string | null }> {
  const supabase = createClient();
  try {
    const { filters, sortBy = "sort_order", sortOrder = "asc" } = params;

    let query = supabase
      .from("subscription_plans")
      .select("*")
      .eq("account_type", "employer");

    if (filters?.status === "active") {
      query = query.eq("is_active", true);
    } else if (filters?.status === "inactive") {
      query = query.eq("is_active", false);
    }

    if (filters?.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      query = query.or(`name.ilike.${term},id.ilike.${term},description.ilike.${term}`);
    }

    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Parallel fetch: plans and usage counts
    const [plansRes, usageRes] = await Promise.all([
      query,
      supabase.rpc("admin_get_employer_plan_usage_counts"),
    ]);

    if (plansRes.error) {
      return { data: [], error: plansRes.error.message };
    }

    // Map usage counts by plan_id
    const usageMap: Record<string, { active: number; total: number }> = {};
    if (!usageRes.error && Array.isArray(usageRes.data)) {
      for (const row of usageRes.data as Array<{ plan_id: string; active_count: number; total_count: number }>) {
        usageMap[row.plan_id] = {
          active: Number(row.active_count || 0),
          total: Number(row.total_count || 0),
        };
      }
    }

    const data: AdminEmployerPlan[] = (plansRes.data || []).map((row) => {
      const usage = usageMap[row.id] || { active: 0, total: 0 };

      return {
        id: row.id,
        name: row.name,
        tagline: row.tagline || "",
        description: row.description || "",
        priceMonthly: Number(row.price_monthly || 0),
        priceQuarterly: Number(row.price_quarterly || 0),
        priceYearly: Number(row.price_yearly || 0),
        currency: (row.currency as PlanCurrency) || "INR",
        durationValue: Number(row.duration_value ?? 1),
        durationUnit: (row.duration_unit as DurationUnit) || "months",
        isActive: Boolean(row.is_active),
        badge: row.badge ?? null,
        highlighted: Boolean(row.highlighted),
        features: Array.isArray(row.features) ? row.features : [],
        featureFlags: Array.isArray(row.feature_flags) ? row.feature_flags : [],
        limits: {
          activeJobs: row.max_active_jobs != null ? Number(row.max_active_jobs) : null,
          applications: row.max_applications != null ? Number(row.max_applications) : null,
          talentSearch: row.max_talent_search != null ? Number(row.max_talent_search) : null,
          teamMembers: row.max_team_members != null ? Number(row.max_team_members) : null,
        },
        sortOrder: Number(row.sort_order || 0),
        activeSubscriptionsCount: usage.active,
        totalSubscriptionsCount: usage.total,
        createdAt: row.created_at,
        updatedAt: row.updated_at || row.created_at,
      };
    });

    return { data, error: null };
  } catch (err: unknown) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch employer plans",
    };
  }
}

/**
 * Fetch a single employer plan by ID.
 */
export async function getEmployerPlanById(
  id: string,
): Promise<{ data: AdminEmployerPlan | null; error: string | null }> {
  const supabase = createClient();
  try {
    const [planRes, usageRes] = await Promise.all([
      supabase.from("subscription_plans").select("*").eq("id", id).maybeSingle(),
      supabase.rpc("admin_get_employer_plan_usage_counts"),
    ]);

    if (planRes.error) {
      return { data: null, error: planRes.error.message };
    }
    if (!planRes.data) {
      return { data: null, error: "Employer plan not found" };
    }

    const row = planRes.data;

    let activeCount = 0;
    let totalCount = 0;
    if (!usageRes.error && Array.isArray(usageRes.data)) {
      const match = (usageRes.data as Array<{ plan_id: string; active_count: number; total_count: number }>).find(
        (u) => u.plan_id === id,
      );
      if (match) {
        activeCount = Number(match.active_count || 0);
        totalCount = Number(match.total_count || 0);
      }
    }

    const plan: AdminEmployerPlan = {
      id: row.id,
      name: row.name,
      tagline: row.tagline || "",
      description: row.description || "",
      priceMonthly: Number(row.price_monthly || 0),
      priceQuarterly: Number(row.price_quarterly || 0),
      priceYearly: Number(row.price_yearly || 0),
      currency: (row.currency as PlanCurrency) || "INR",
      durationValue: Number(row.duration_value ?? 1),
      durationUnit: (row.duration_unit as DurationUnit) || "months",
      isActive: Boolean(row.is_active),
      badge: row.badge ?? null,
      highlighted: Boolean(row.highlighted),
      features: Array.isArray(row.features) ? row.features : [],
      featureFlags: Array.isArray(row.feature_flags) ? row.feature_flags : [],
      limits: {
        activeJobs: row.max_active_jobs != null ? Number(row.max_active_jobs) : null,
        applications: row.max_applications != null ? Number(row.max_applications) : null,
        talentSearch: row.max_talent_search != null ? Number(row.max_talent_search) : null,
        teamMembers: row.max_team_members != null ? Number(row.max_team_members) : null,
      },
      sortOrder: Number(row.sort_order || 0),
      activeSubscriptionsCount: activeCount,
      totalSubscriptionsCount: totalCount,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    };

    return { data: plan, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to fetch employer plan",
    };
  }
}

/**
 * Validates employer plan payload.
 */
function validateEmployerPlanData(data: Partial<EmployerPlanFormData>, isCreate = false): string | null {
  if (isCreate) {
    if (!data.id || !data.id.trim()) {
      return "Plan slug/ID is required.";
    }
    const cleanId = data.id.trim().toLowerCase();
    if (!/^[a-z0-9_-]+$/.test(cleanId)) {
      return "Plan ID may only contain lowercase letters, numbers, hyphens, and underscores.";
    }
  }

  if (!data.name || !data.name.trim()) {
    return "Plan name is required.";
  }
  if (data.name.trim().length < 2 || data.name.trim().length > 60) {
    return "Plan name must be between 2 and 60 characters.";
  }
  if (data.priceMonthly === undefined || isNaN(Number(data.priceMonthly)) || Number(data.priceMonthly) < 0) {
    return "Monthly price must be a valid number >= 0.";
  }
  if (data.priceQuarterly !== undefined && (isNaN(Number(data.priceQuarterly)) || Number(data.priceQuarterly) < 0)) {
    return "Quarterly price must be a valid number >= 0.";
  }
  if (data.priceYearly !== undefined && (isNaN(Number(data.priceYearly)) || Number(data.priceYearly) < 0)) {
    return "Yearly price must be a valid number >= 0.";
  }
  if (!data.currency || !data.currency.trim()) {
    return "Currency is required.";
  }
  if (data.durationValue === undefined || isNaN(Number(data.durationValue)) || Number(data.durationValue) <= 0) {
    return "Duration value must be a positive integer.";
  }
  if (data.sortOrder !== undefined && (isNaN(Number(data.sortOrder)) || Number(data.sortOrder) < 0)) {
    return "Display order must be 0 or higher.";
  }

  return null;
}

/**
 * Create a new employer subscription plan.
 */
export async function createEmployerPlan(
  formData: EmployerPlanFormData,
): Promise<{ success: boolean; data?: AdminEmployerPlan; error?: string }> {
  const supabase = createClient();
  try {
    const valError = validateEmployerPlanData(formData, true);
    if (valError) {
      return { success: false, error: valError };
    }

    const cleanId = formData.id.trim().toLowerCase();
    const cleanName = formData.name.trim();

    // Check slug uniqueness
    const { data: existingSlug } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("id", cleanId)
      .maybeSingle();

    if (existingSlug) {
      return { success: false, error: `An employer plan with ID "${cleanId}" already exists.` };
    }

    // Check name uniqueness
    const { data: existingName } = await supabase
      .from("subscription_plans")
      .select("id, name")
      .ilike("name", cleanName)
      .maybeSingle();

    if (existingName) {
      return { success: false, error: `An employer plan named "${cleanName}" already exists.` };
    }

    const payload = {
      id: cleanId,
      name: cleanName,
      tagline: formData.tagline?.trim() || "",
      description: formData.description?.trim() || "",
      price_monthly: Number(formData.priceMonthly || 0),
      price_quarterly: Number(formData.priceQuarterly ?? Number(formData.priceMonthly || 0) * 3),
      price_yearly: Number(formData.priceYearly ?? Number(formData.priceMonthly || 0) * 12),
      currency: formData.currency || "INR",
      duration_value: Math.max(1, Math.floor(Number(formData.durationValue || 1))),
      duration_unit: formData.durationUnit || "months",
      account_type: "employer" as const,
      is_active: formData.isActive ?? true,
      badge: formData.badge?.trim() || null,
      highlighted: Boolean(formData.highlighted),
      features: (formData.features || []).map((f) => f.trim()).filter(Boolean),
      feature_flags: formData.featureFlags || [],
      max_active_jobs: formData.limits.activeJobs != null ? Math.max(0, Math.floor(Number(formData.limits.activeJobs))) : null,
      max_applications: formData.limits.applications != null ? Math.max(0, Math.floor(Number(formData.limits.applications))) : null,
      max_talent_search: formData.limits.talentSearch != null ? Math.max(0, Math.floor(Number(formData.limits.talentSearch))) : null,
      max_team_members: formData.limits.teamMembers != null ? Math.max(0, Math.floor(Number(formData.limits.teamMembers))) : null,
      sort_order: Math.max(0, Math.floor(Number(formData.sortOrder || 0))),
    };

    const { data, error } = await supabase
      .from("subscription_plans")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        tagline: data.tagline || "",
        description: data.description || "",
        priceMonthly: Number(data.price_monthly),
        priceQuarterly: Number(data.price_quarterly || 0),
        priceYearly: Number(data.price_yearly || 0),
        currency: (data.currency as PlanCurrency) || "INR",
        durationValue: Number(data.duration_value ?? 1),
        durationUnit: (data.duration_unit as DurationUnit) || "months",
        isActive: Boolean(data.is_active),
        badge: data.badge,
        highlighted: Boolean(data.highlighted),
        features: data.features || [],
        featureFlags: data.feature_flags || [],
        limits: {
          activeJobs: data.max_active_jobs,
          applications: data.max_applications,
          talentSearch: data.max_talent_search,
          teamMembers: data.max_team_members,
        },
        sortOrder: Number(data.sort_order || 0),
        activeSubscriptionsCount: 0,
        totalSubscriptionsCount: 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at || data.created_at,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create employer plan",
    };
  }
}

/**
 * Update an existing employer subscription plan.
 */
export async function updateEmployerPlan(
  id: string,
  formData: Partial<EmployerPlanFormData>,
): Promise<{ success: boolean; data?: AdminEmployerPlan; error?: string }> {
  const supabase = createClient();
  try {
    const valError = validateEmployerPlanData(formData, false);
    if (valError) {
      return { success: false, error: valError };
    }

    const cleanName = formData.name?.trim();

    // Check name uniqueness against other employer plans
    if (cleanName) {
      const { data: existingName } = await supabase
        .from("subscription_plans")
        .select("id, name")
        .ilike("name", cleanName)
        .neq("id", id)
        .maybeSingle();

      if (existingName) {
        return { success: false, error: `Another employer plan named "${cleanName}" already exists.` };
      }
    }

    const updatePayload: Partial<import("@/types/database").Database["public"]["Tables"]["subscription_plans"]["Row"]> = {};

    if (formData.name !== undefined) updatePayload.name = cleanName;
    if (formData.tagline !== undefined) updatePayload.tagline = formData.tagline.trim();
    if (formData.description !== undefined) updatePayload.description = formData.description.trim();
    if (formData.priceMonthly !== undefined) updatePayload.price_monthly = Number(formData.priceMonthly);
    if (formData.priceQuarterly !== undefined) updatePayload.price_quarterly = Number(formData.priceQuarterly);
    if (formData.priceYearly !== undefined) updatePayload.price_yearly = Number(formData.priceYearly);
    if (formData.currency !== undefined) updatePayload.currency = formData.currency;
    if (formData.durationValue !== undefined) updatePayload.duration_value = Math.max(1, Math.floor(Number(formData.durationValue)));
    if (formData.durationUnit !== undefined) updatePayload.duration_unit = formData.durationUnit;
    if (formData.isActive !== undefined) updatePayload.is_active = Boolean(formData.isActive);
    if (formData.badge !== undefined) updatePayload.badge = formData.badge.trim() || null;
    if (formData.highlighted !== undefined) updatePayload.highlighted = Boolean(formData.highlighted);
    if (formData.features !== undefined) updatePayload.features = formData.features.map((f) => f.trim()).filter(Boolean);
    if (formData.featureFlags !== undefined) updatePayload.feature_flags = formData.featureFlags;
    if (formData.limits !== undefined) {
      updatePayload.max_active_jobs = formData.limits.activeJobs != null ? Math.max(0, Math.floor(Number(formData.limits.activeJobs))) : null;
      updatePayload.max_applications = formData.limits.applications != null ? Math.max(0, Math.floor(Number(formData.limits.applications))) : null;
      updatePayload.max_talent_search = formData.limits.talentSearch != null ? Math.max(0, Math.floor(Number(formData.limits.talentSearch))) : null;
      updatePayload.max_team_members = formData.limits.teamMembers != null ? Math.max(0, Math.floor(Number(formData.limits.teamMembers))) : null;
    }
    if (formData.sortOrder !== undefined) updatePayload.sort_order = Math.max(0, Math.floor(Number(formData.sortOrder)));

    const { data, error } = await supabase
      .from("subscription_plans")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        tagline: data.tagline || "",
        description: data.description || "",
        priceMonthly: Number(data.price_monthly),
        priceQuarterly: Number(data.price_quarterly || 0),
        priceYearly: Number(data.price_yearly || 0),
        currency: (data.currency as PlanCurrency) || "INR",
        durationValue: Number(data.duration_value ?? 1),
        durationUnit: (data.duration_unit as DurationUnit) || "months",
        isActive: Boolean(data.is_active),
        badge: data.badge,
        highlighted: Boolean(data.highlighted),
        features: data.features || [],
        featureFlags: data.feature_flags || [],
        limits: {
          activeJobs: data.max_active_jobs,
          applications: data.max_applications,
          talentSearch: data.max_talent_search,
          teamMembers: data.max_team_members,
        },
        sortOrder: Number(data.sort_order || 0),
        createdAt: data.created_at,
        updatedAt: data.updated_at || data.created_at,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update employer plan",
    };
  }
}

/**
 * Activate or deactivate an employer plan.
 */
export async function toggleEmployerPlanStatus(
  id: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from("subscription_plans")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to toggle employer plan status",
    };
  }
}

/**
 * Update employer plan sort order.
 */
export async function updateEmployerPlanOrder(
  id: string,
  sortOrder: number,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from("subscription_plans")
      .update({ sort_order: Math.max(0, Math.floor(sortOrder)) })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update plan order",
    };
  }
}
