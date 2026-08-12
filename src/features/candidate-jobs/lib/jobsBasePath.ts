"use client";

import { usePathname } from "next/navigation";

export const PUBLIC_JOBS_BASE = "/jobs";
export const CANDIDATE_JOBS_BASE = "/candidate/jobs";

/** List / details base path from the current route (candidate portal vs public). */
export function resolveJobsBasePath(pathname: string | null | undefined): string {
  if (pathname?.startsWith("/candidate")) return CANDIDATE_JOBS_BASE;
  return PUBLIC_JOBS_BASE;
}

export function useJobsBasePath(): string {
  return resolveJobsBasePath(usePathname());
}

export function jobsListHref(basePath: string, queryString?: string): string {
  if (!queryString) return basePath;
  return `${basePath}?${queryString}`;
}

export function jobDetailsHref(basePath: string, jobId: string): string {
  return `${basePath}/${jobId}`;
}

/** Keep apply navigation within the public or candidate job area. */
export function jobApplyHref(basePath: string, jobId: string): string {
  return `${basePath}/${jobId}/apply`;
}
