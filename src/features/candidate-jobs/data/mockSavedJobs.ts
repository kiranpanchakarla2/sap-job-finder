import { MOCK_DISCOVERY_JOBS } from "./mockJobs";
import type { DiscoveryJob } from "../types/job.types";

export type SavedJobItem = DiscoveryJob & { savedAt: string };

const now = new Date();
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

export const INITIAL_SAVED_JOB_IDS: { id: string; savedAt: string }[] = [
  { id: "fiori-accenture-pune", savedAt: daysAgo(1) },
  { id: "btp-deloitte-gg", savedAt: daysAgo(3) },
  { id: "abap-techm-hyd", savedAt: daysAgo(6) },
  { id: "fico-infosys-blr", savedAt: daysAgo(12) },
  { id: "sd-capgemini-hyd", savedAt: daysAgo(20) },
];

export function getMockSavedJobs(): SavedJobItem[] {
  const jobMap = new Map(MOCK_DISCOVERY_JOBS.map((j) => [j.id, j]));
  const list: SavedJobItem[] = [];

  for (const entry of INITIAL_SAVED_JOB_IDS) {
    const found = jobMap.get(entry.id);
    if (found) {
      // Simulate closed status for sd-capgemini-hyd to demonstrate closed state handling
      const status = entry.id === "sd-capgemini-hyd" ? "closed" : found.status;
      list.push({
        ...found,
        status,
        savedAt: entry.savedAt,
      });
    }
  }

  return list;
}
