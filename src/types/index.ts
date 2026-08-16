import type { Database } from "./database";

export type {
  AppRole,
  ApplicationStatus,
  Database,
  JobStatus,
  Json,
  UserRole,
  WorkMode,
  ContactRequestUserType,
  ContactRequestStatus,
  ContactRequestPriority,
  ContactRequestCategory,
} from "./database";

export type {
  ContactRequest,
  ContactRequestInsert,
  ContactRequestInsertInput,
  ContactRequestUpdate,
  ContactRequestResult,
  ContactAttachmentUploadResult,
} from "./contact";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
