/**
 * Admin Dashboard Feature Module
 * Sprint 10B: Central export point for super admin dashboard components, hooks, and services.
 */

export { AdminDashboard } from "./components/AdminDashboard";
export { AdminDashboardHeader } from "./components/AdminDashboardHeader";
export { UsersKpiSection } from "./components/UsersKpiSection";
export { SubscriptionsKpiSection } from "./components/SubscriptionsKpiSection";
export { PaymentsKpiSection } from "./components/PaymentsKpiSection";
export { PendingPaymentsTable } from "./components/PendingPaymentsTable";
export { SubscriptionSummaryCard } from "./components/SubscriptionSummaryCard";
export { RecentActivityFeed } from "./components/RecentActivityFeed";
export { RecentCandidatesTable } from "./components/RecentCandidatesTable";
export { RecentEmployersTable } from "./components/RecentEmployersTable";
export { RecentJobsTable } from "./components/RecentJobsTable";
export { ContactUsSummaryCard } from "./components/ContactUsSummaryCard";
export { SapModulesSummaryCard } from "./components/SapModulesSummaryCard";

export { useAdminDashboard } from "./hooks/useAdminDashboard";
export * from "./types/dashboard.types";
export * from "./services/adminDashboardService";
