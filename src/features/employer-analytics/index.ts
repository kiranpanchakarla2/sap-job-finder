export { AnalyticsPage } from "./pages/AnalyticsPage";
export { analyticsService } from "./services/analyticsService";
export { useEmployerAnalytics } from "./hooks/useEmployerAnalytics";
export type {
  AnalyticsFilters,
  EmployerAnalyticsData,
} from "./types/analytics.types";

export const EMPLOYER_ANALYTICS_ROUTES = {
  analytics: "/employer/analytics",
} as const;
