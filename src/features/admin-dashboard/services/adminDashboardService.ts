/**
 * Super Admin Dashboard Service
 * Sprint 10B: Real-time queries for platform metrics, KPI counts, tables, and recent activity.
 */

import { createClient } from "@/lib/supabase/client";
import { SAP_MODULE_OPTIONS } from "@/types/candidate";
import type {
  ActivityItem,
  ContactUsSummary,
  DashboardData,
  DashboardErrors,
  DateRangeFilter,
  DateRangeOption,
  PaymentKpis,
  PendingPaymentItem,
  RecentCandidateItem,
  RecentEmployerItem,
  RecentJobItem,
  SapModuleSummary,
  SubscriptionKpis,
  UsersKpis,
} from "../types/dashboard.types";

/**
 * Calculates date range boundary timestamps for filtering.
 */
export function calculateDateRange(
  option: DateRangeOption,
  customStart?: string,
  customEnd?: string,
): DateRangeFilter {
  const now = new Date();

  if (option === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return {
      option,
      startDate: start.toISOString(),
      endDate: now.toISOString(),
      label: "Today",
    };
  }

  if (option === "7d") {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      option,
      startDate: start.toISOString(),
      endDate: now.toISOString(),
      label: "Last 7 Days",
    };
  }

  if (option === "30d") {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      option,
      startDate: start.toISOString(),
      endDate: now.toISOString(),
      label: "Last 30 Days",
    };
  }

  if (option === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return {
      option,
      startDate: start.toISOString(),
      endDate: now.toISOString(),
      label: "This Month",
    };
  }

  if (option === "last_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return {
      option,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      label: "Last Month",
    };
  }

  if (option === "custom" && customStart && customEnd) {
    return {
      option,
      startDate: new Date(customStart).toISOString(),
      endDate: new Date(customEnd).toISOString(),
      label: "Custom Range",
    };
  }

  // Fallback to Last 30 Days
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    option: "30d",
    startDate: start.toISOString(),
    endDate: now.toISOString(),
    label: "Last 30 Days",
  };
}

/**
 * Fetch Users KPIs (Candidates & Employers counts)
 */
export async function fetchUsersKpis(
  filter: DateRangeFilter,
): Promise<{ data: UsersKpis | null; error: string | null }> {
  const supabase = createClient();
  try {
    const [totalCandRes, totalEmpRes, newCandRes, newEmpRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "candidate"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "employer"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "candidate")
        .gte("created_at", filter.startDate)
        .lte("created_at", filter.endDate),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "employer")
        .gte("created_at", filter.startDate)
        .lte("created_at", filter.endDate),
    ]);

    if (totalCandRes.error || totalEmpRes.error || newCandRes.error || newEmpRes.error) {
      const err =
        totalCandRes.error?.message ||
        totalEmpRes.error?.message ||
        newCandRes.error?.message ||
        newEmpRes.error?.message ||
        "Failed to fetch users metrics";
      return { data: null, error: err };
    }

    return {
      data: {
        totalCandidates: totalCandRes.count ?? 0,
        totalEmployers: totalEmpRes.count ?? 0,
        newCandidates: newCandRes.count ?? 0,
        newEmployers: newEmpRes.count ?? 0,
      },
      error: null,
    };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Error fetching user KPIs" };
  }
}

/**
 * Fetch Subscriptions KPIs
 */
export async function fetchSubscriptionKpis(): Promise<{
  data: SubscriptionKpis | null;
  error: string | null;
}> {
  const supabase = createClient();
  try {
    const nowIso = new Date().toISOString();
    const sevenDaysLaterIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      activeCandRes,
      expiringCandRes,
      activeEmpRes,
      expiringEmpRes,
      recentCandSubsRes,
      recentEmpSubsRes,
    ] = await Promise.all([
      supabase.from("candidate_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase
        .from("candidate_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .gte("current_period_end", nowIso)
        .lte("current_period_end", sevenDaysLaterIso),
      supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .gte("current_period_end", nowIso)
        .lte("current_period_end", sevenDaysLaterIso),
      supabase
        .from("candidate_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .gte("created_at", thirtyDaysAgoIso),
      supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .gte("created_at", thirtyDaysAgoIso),
    ]);

    if (
      activeCandRes.error ||
      expiringCandRes.error ||
      activeEmpRes.error ||
      expiringEmpRes.error ||
      recentCandSubsRes.error ||
      recentEmpSubsRes.error
    ) {
      const err =
        activeCandRes.error?.message ||
        expiringCandRes.error?.message ||
        activeEmpRes.error?.message ||
        expiringEmpRes.error?.message ||
        "Failed to fetch subscription metrics";
      return { data: null, error: err };
    }

    const recentlyActivatedCount =
      (recentCandSubsRes.count ?? 0) + (recentEmpSubsRes.count ?? 0);

    return {
      data: {
        activeCandidateSubs: activeCandRes.count ?? 0,
        expiringCandidateSubs: expiringCandRes.count ?? 0,
        activeEmployerSubs: activeEmpRes.count ?? 0,
        expiringEmployerSubs: expiringEmpRes.count ?? 0,
        recentlyActivatedCount,
      },
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error fetching subscription KPIs",
    };
  }
}

/**
 * Fetch Payment KPIs
 */
export async function fetchPaymentKpis(
  filter: DateRangeFilter,
): Promise<{ data: PaymentKpis | null; error: string | null }> {
  const supabase = createClient();
  try {
    const [pendingRes, paidCountRes, allPaidAmountsRes, periodRequestsRes, periodPaidAmountsRes] =
      await Promise.all([
        supabase
          .from("payment_requests")
          .select("id", { count: "exact", head: true })
          .in("status", ["pending", "payment_link_sent"]),
        supabase
          .from("payment_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "payment_received"),
        supabase.from("payment_requests").select("amount, currency").eq("status", "payment_received"),
        supabase
          .from("payment_requests")
          .select("id", { count: "exact", head: true })
          .gte("created_at", filter.startDate)
          .lte("created_at", filter.endDate),
        supabase
          .from("payment_requests")
          .select("amount, payment_received_at, created_at")
          .eq("status", "payment_received")
          .or(
            `and(payment_received_at.gte.${filter.startDate},payment_received_at.lte.${filter.endDate}),and(payment_received_at.is.null,created_at.gte.${filter.startDate},created_at.lte.${filter.endDate})`,
          ),
      ]);

    if (pendingRes.error || paidCountRes.error || allPaidAmountsRes.error || periodRequestsRes.error) {
      const err =
        pendingRes.error?.message ||
        paidCountRes.error?.message ||
        allPaidAmountsRes.error?.message ||
        periodRequestsRes.error?.message ||
        "Failed to fetch payment metrics";
      return { data: null, error: err };
    }

    const totalAmountCollected = (allPaidAmountsRes.data || []).reduce(
      (acc, curr) => acc + (Number(curr.amount) || 0),
      0,
    );

    const collectedInPeriod = (periodPaidAmountsRes.data || []).reduce(
      (acc, curr) => acc + (Number(curr.amount) || 0),
      0,
    );

    return {
      data: {
        pendingRequestsCount: pendingRes.count ?? 0,
        paymentsReceivedCount: paidCountRes.count ?? 0,
        totalAmountCollected,
        requestsInPeriod: periodRequestsRes.count ?? 0,
        collectedInPeriod,
        currency: "INR",
      },
      error: null,
    };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Error fetching payment KPIs" };
  }
}

/**
 * Fetch Pending Payment Requests (Read-only list, limit 5)
 */
export async function fetchPendingPaymentRequests(): Promise<{
  data: PendingPaymentItem[] | null;
  error: string | null;
}> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("payment_requests")
      .select("id, customer_name, email, account_type, plan_name, amount, currency, created_at, status")
      .in("status", ["pending", "payment_link_sent"])
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      return { data: null, error: error.message };
    }

    const items: PendingPaymentItem[] = (data || []).map((row) => ({
      id: row.id,
      requesterName: row.customer_name || "Unknown",
      email: row.email || "",
      accountType: (row.account_type as "candidate" | "employer") || "candidate",
      planName: row.plan_name || "Subscription Plan",
      amount: Number(row.amount) || 0,
      currency: row.currency || "INR",
      requestedAt: row.created_at,
      status: row.status as PendingPaymentItem["status"],
    }));

    return { data: items, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error fetching pending payments",
    };
  }
}

/**
 * Fetch Recent Candidates (latest 5)
 */
export async function fetchRecentCandidates(): Promise<{
  data: RecentCandidateItem[] | null;
  error: string | null;
}> {
  const supabase = createClient();
  try {
    // 1. Fetch candidate profiles
    const { data: candData, error: candError } = await supabase
      .from("candidate_profiles")
      .select("id, user_id, first_name, last_name, headline, current_city, location, discovery_status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (candError) {
      return { data: null, error: candError.message };
    }

    if (!candData || candData.length === 0) {
      return { data: [], error: null };
    }

    const userIds = candData.map((c) => c.user_id).filter(Boolean);
    const { data: profileData } = await supabase
      .from("profiles")
      .select("user_id, email, first_name, last_name")
      .in("user_id", userIds);

    const emailMap = new Map<string, string>();
    const nameMap = new Map<string, string>();
    (profileData || []).forEach((p) => {
      if (p.email) emailMap.set(p.user_id, p.email);
      const fullName = [p.first_name, p.last_name].filter(Boolean).join(" ");
      if (fullName) nameMap.set(p.user_id, fullName);
    });

    const result: RecentCandidateItem[] = candData.map((c) => {
      const pName = nameMap.get(c.user_id);
      const cName = [c.first_name, c.last_name].filter(Boolean).join(" ");
      const name = cName || pName || "Registered Candidate";
      const email = emailMap.get(c.user_id) || "—";
      const statusLabel =
        c.discovery_status === "open_to_opportunities"
          ? "Open to Work"
          : c.discovery_status === "available"
            ? "Available"
            : c.discovery_status === "not_available"
              ? "Not Available"
              : "Active";

      return {
        id: c.id,
        userId: c.user_id,
        name,
        email,
        registrationDate: c.created_at,
        status: statusLabel,
        headline: c.headline,
        location: c.location || c.current_city,
      };
    });

    return { data: result, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error fetching recent candidates",
    };
  }
}

/**
 * Fetch Recent Employers (latest 5)
 */
export async function fetchRecentEmployers(): Promise<{
  data: RecentEmployerItem[] | null;
  error: string | null;
}> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("company_profiles")
      .select("id, user_id, company_name, work_email, industry, city, setup_complete, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      return { data: null, error: error.message };
    }

    const items: RecentEmployerItem[] = (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      companyName: row.company_name || "Company",
      email: row.work_email || "—",
      registrationDate: row.created_at,
      status: row.setup_complete ? "Verified & Active" : "Pending Setup",
      industry: row.industry,
      city: row.city,
    }));

    return { data: items, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error fetching recent employers",
    };
  }
}

/**
 * Fetch Recent Jobs (latest 5)
 */
export async function fetchRecentJobs(): Promise<{
  data: RecentJobItem[] | null;
  error: string | null;
}> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("id, title, sap_module, location, employment_type, status, created_at, company_id")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    const companyIds = Array.from(new Set(data.map((j) => j.company_id).filter(Boolean)));
    const { data: companies } = await supabase
      .from("company_profiles")
      .select("id, company_name")
      .in("id", companyIds);

    const compMap = new Map<string, string>();
    (companies || []).forEach((c) => {
      if (c.company_name) compMap.set(c.id, c.company_name);
    });

    const items: RecentJobItem[] = data.map((job) => ({
      id: job.id,
      title: job.title,
      companyName: compMap.get(job.company_id) || "Hiring Company",
      sapModule: job.sap_module || "SAP",
      location: job.location || "Remote",
      postedDate: job.created_at,
      status: job.status,
      employmentType: job.employment_type,
    }));

    return { data: items, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error fetching recent jobs",
    };
  }
}

/**
 * Fetch Contact Us Summary
 */
export async function fetchContactUsSummary(): Promise<{
  data: ContactUsSummary | null;
  error: string | null;
}> {
  const supabase = createClient();
  try {
    const [newRes, inProgRes, resolvedRes, totalRes] = await Promise.all([
      supabase.from("contact_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase
        .from("contact_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "in_progress"),
      supabase
        .from("contact_requests")
        .select("id", { count: "exact", head: true })
        .in("status", ["resolved", "closed"]),
      supabase.from("contact_requests").select("id", { count: "exact", head: true }),
    ]);

    if (newRes.error || inProgRes.error || resolvedRes.error || totalRes.error) {
      const err =
        newRes.error?.message ||
        inProgRes.error?.message ||
        resolvedRes.error?.message ||
        totalRes.error?.message ||
        "Failed to fetch contact requests";
      return { data: null, error: err };
    }

    return {
      data: {
        newCount: newRes.count ?? 0,
        inProgressCount: inProgRes.count ?? 0,
        resolvedCount: resolvedRes.count ?? 0,
        totalCount: totalRes.count ?? 0,
      },
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error fetching Contact Us summary",
    };
  }
}

/**
 * Fetch SAP Modules Summary
 */
export async function fetchSapModulesSummary(): Promise<{
  data: SapModuleSummary | null;
  error: string | null;
}> {
  const supabase = createClient();
  try {
    const totalActiveModules = SAP_MODULE_OPTIONS.length;

    // Fetch jobs to see which modules are actively posted
    const { data: jobs, error } = await supabase.from("jobs").select("sap_module");

    if (error) {
      return { data: null, error: error.message };
    }

    const counts: Record<string, number> = {};
    (jobs || []).forEach((j) => {
      if (j.sap_module) {
        counts[j.sap_module] = (counts[j.sap_module] || 0) + 1;
      }
    });

    const topModules = Object.entries(counts)
      .map(([module, jobCount]) => ({ module, jobCount }))
      .sort((a, b) => b.jobCount - a.jobCount)
      .slice(0, 5);

    return {
      data: {
        totalActiveModules,
        topModules,
      },
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error fetching SAP module summary",
    };
  }
}

/**
 * Fetch Recent Activity Feed (Aggregated from real platform tables, limit 10)
 */
export async function fetchRecentActivity(): Promise<{
  data: ActivityItem[] | null;
  error: string | null;
}> {
  const supabase = createClient();
  try {
    const [candRes, compRes, payReqRes, paidRes, candSubsRes, empSubsRes, jobsRes, contactRes] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, user_id, first_name, last_name, email, created_at")
          .eq("role", "candidate")
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("company_profiles")
          .select("id, company_name, created_at")
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("payment_requests")
          .select("id, customer_name, plan_name, amount, currency, created_at")
          .in("status", ["pending", "payment_link_sent"])
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("payment_requests")
          .select("id, customer_name, plan_name, amount, currency, payment_received_at, created_at")
          .eq("status", "payment_received")
          .order("payment_received_at", { ascending: false })
          .limit(4),
        supabase
          .from("candidate_subscriptions")
          .select("id, status, created_at")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("subscriptions")
          .select("id, status, created_at")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("jobs")
          .select("id, title, sap_module, created_at")
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("contact_requests")
          .select("id, name, subject, category, created_at")
          .order("created_at", { ascending: false })
          .limit(4),
      ]);

    const activityList: ActivityItem[] = [];

    (candRes.data || []).forEach((c) => {
      const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || "Candidate";
      activityList.push({
        id: `cand-${c.id}`,
        type: "candidate_registered",
        title: "Candidate Registered",
        description: `${name} joined SAP Job Finder`,
        timestamp: c.created_at,
        userOrCompany: name,
      });
    });

    (compRes.data || []).forEach((e) => {
      activityList.push({
        id: `comp-${e.id}`,
        type: "employer_registered",
        title: "Employer Registered",
        description: `${e.company_name} created an employer organization`,
        timestamp: e.created_at,
        userOrCompany: e.company_name,
      });
    });

    (payReqRes.data || []).forEach((pr) => {
      activityList.push({
        id: `payreq-${pr.id}`,
        type: "payment_requested",
        title: "Payment Request Submitted",
        description: `${pr.customer_name} requested ${pr.plan_name || "Subscription"} (₹${pr.amount})`,
        timestamp: pr.created_at,
        userOrCompany: pr.customer_name,
      });
    });

    (paidRes.data || []).forEach((p) => {
      const ts = p.payment_received_at || p.created_at;
      activityList.push({
        id: `paid-${p.id}`,
        type: "payment_received",
        title: "Payment Recorded",
        description: `Received ₹${p.amount} for ${p.plan_name || "Plan"} from ${p.customer_name}`,
        timestamp: ts,
        userOrCompany: p.customer_name,
      });
    });

    (candSubsRes.data || []).forEach((s) => {
      activityList.push({
        id: `candsub-${s.id}`,
        type: "subscription_activated",
        title: "Candidate Subscription Active",
        description: "Candidate subscription activated successfully",
        timestamp: s.created_at,
      });
    });

    (empSubsRes.data || []).forEach((s) => {
      activityList.push({
        id: `empsub-${s.id}`,
        type: "subscription_activated",
        title: "Employer Subscription Active",
        description: "Employer subscription activated successfully",
        timestamp: s.created_at,
      });
    });

    (jobsRes.data || []).forEach((j) => {
      activityList.push({
        id: `job-${j.id}`,
        type: "job_posted",
        title: "Job Posted",
        description: `"${j.title}" (${j.sap_module}) posted on portal`,
        timestamp: j.created_at,
      });
    });

    (contactRes.data || []).forEach((cr) => {
      activityList.push({
        id: `contact-${cr.id}`,
        type: "contact_enquiry",
        title: "Contact Enquiry Received",
        description: `${cr.name} submitted: "${cr.subject}"`,
        timestamp: cr.created_at,
        userOrCompany: cr.name,
      });
    });

    // Sort by timestamp descending
    activityList.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return { data: activityList.slice(0, 10), error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Error fetching activity feed",
    };
  }
}

/**
 * Fetch all Dashboard Data in parallel
 */
export async function fetchFullDashboardData(
  filter: DateRangeFilter,
): Promise<{ data: DashboardData | null; errors: DashboardErrors }> {
  const [
    usersRes,
    subsRes,
    payRes,
    pendingPayRes,
    recentCandRes,
    recentEmpRes,
    recentJobsRes,
    contactRes,
    sapRes,
    activityRes,
  ] = await Promise.all([
    fetchUsersKpis(filter),
    fetchSubscriptionKpis(),
    fetchPaymentKpis(filter),
    fetchPendingPaymentRequests(),
    fetchRecentCandidates(),
    fetchRecentEmployers(),
    fetchRecentJobs(),
    fetchContactUsSummary(),
    fetchSapModulesSummary(),
    fetchRecentActivity(),
  ]);

  const errors: DashboardErrors = {};
  if (usersRes.error) errors.users = usersRes.error;
  if (subsRes.error) errors.subscriptions = subsRes.error;
  if (payRes.error) errors.payments = payRes.error;
  if (pendingPayRes.error) errors.pendingPayments = pendingPayRes.error;
  if (recentCandRes.error) errors.recentCandidates = recentCandRes.error;
  if (recentEmpRes.error) errors.recentEmployers = recentEmpRes.error;
  if (recentJobsRes.error) errors.recentJobs = recentJobsRes.error;
  if (contactRes.error) errors.contactUs = contactRes.error;
  if (sapRes.error) errors.sapModules = sapRes.error;
  if (activityRes.error) errors.recentActivity = activityRes.error;

  const data: DashboardData = {
    users: usersRes.data || {
      totalCandidates: 0,
      totalEmployers: 0,
      newCandidates: 0,
      newEmployers: 0,
    },
    subscriptions: subsRes.data || {
      activeCandidateSubs: 0,
      expiringCandidateSubs: 0,
      activeEmployerSubs: 0,
      expiringEmployerSubs: 0,
      recentlyActivatedCount: 0,
    },
    payments: payRes.data || {
      pendingRequestsCount: 0,
      paymentsReceivedCount: 0,
      totalAmountCollected: 0,
      requestsInPeriod: 0,
      collectedInPeriod: 0,
      currency: "INR",
    },
    pendingPayments: pendingPayRes.data || [],
    recentCandidates: recentCandRes.data || [],
    recentEmployers: recentEmpRes.data || [],
    recentJobs: recentJobsRes.data || [],
    contactUs: contactRes.data || {
      newCount: 0,
      inProgressCount: 0,
      resolvedCount: 0,
      totalCount: 0,
    },
    sapModules: sapRes.data || {
      totalActiveModules: SAP_MODULE_OPTIONS.length,
      topModules: [],
    },
    recentActivity: activityRes.data || [],
  };

  return { data, errors };
}
