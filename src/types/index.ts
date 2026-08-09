import type { Database } from "./database";

export type {
  AppRole,
  ApplicationStatus,
  Database,
  JobStatus,
  Json,
  UserRole,
  WorkMode,
} from "./database";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
