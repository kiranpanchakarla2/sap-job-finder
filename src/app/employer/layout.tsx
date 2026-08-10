import type { ReactNode } from "react";

/**
 * Root employer segment layout.
 * Auth pages and the Sprint 1 dashboard placeholder opt out of the app shell.
 * Protected app pages live under `(app)` with `EmployerLayout`.
 */
export default function EmployerRouteLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
