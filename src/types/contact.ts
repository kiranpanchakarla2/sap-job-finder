/**
 * Contact Us Foundation Types
 * Sprint 8A: Shared types for Public, Candidate, Employer, and future Super Admin support.
 */

export type ContactRequestUserType = "anonymous" | "candidate" | "employer";

export type ContactRequestStatus = "new" | "in_progress" | "resolved" | "closed";

export type ContactRequestPriority = "low" | "normal" | "high" | "urgent";

export type ContactRequestCategory =
  | "general"
  | "candidate_support"
  | "employer_support"
  | "account"
  | "job_application"
  | "job_posting"
  | "bulk_upload"
  | "talent_search"
  | "community"
  | "technical_issue"
  | "subscription"
  | "payment"
  | "report_problem"
  | "partnership"
  | "other";

export interface ContactRequest {
  id: string;
  user_id: string | null;
  user_type: ContactRequestUserType;
  company_id: string | null;
  name: string;
  email: string;
  category: ContactRequestCategory;
  subject: string;
  message: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  status: ContactRequestStatus;
  priority: ContactRequestPriority;
  assigned_to: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Payload submitted by clients (Public, Candidate, Employer).
 * Internal admin fields (status, priority, assigned_to, admin_notes) cannot be manipulated by users.
 */
export interface ContactRequestInsertInput {
  name: string;
  email: string;
  category: ContactRequestCategory;
  subject: string;
  message: string;
  user_type?: ContactRequestUserType;
  company_id?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
}

export type ContactRequestInsert = {
  id?: string;
  user_id?: string | null;
  user_type?: ContactRequestUserType;
  company_id?: string | null;
  name: string;
  email: string;
  category: ContactRequestCategory;
  subject: string;
  message: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
  status?: ContactRequestStatus;
  priority?: ContactRequestPriority;
  assigned_to?: string | null;
  admin_notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ContactRequestUpdate = Partial<ContactRequest>;

export type ContactRequestResult =
  | {
      success: true;
      data: ContactRequest;
    }
  | {
      success: false;
      error: string;
    };

export type ContactAttachmentUploadResult =
  | {
      success: true;
      path: string;
      fullUrl?: string;
      name: string;
      size: number;
    }
  | {
      success: false;
      error: string;
    };

// =============================================================================
// Sprint 8E: Support Operations Backend Types
// =============================================================================

export type ContactRequestEventType =
  | "created"
  | "status_changed"
  | "priority_changed"
  | "assigned"
  | "unassigned"
  | "note_added"
  | "attachment_uploaded";

export interface ContactRequestNote {
  id: string;
  contact_request_id: string;
  author_user_id: string | null;
  note: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_avatar_url?: string | null;
}

export interface ContactRequestEvent {
  id: string;
  contact_request_id: string;
  actor_user_id: string | null;
  event_type: ContactRequestEventType;
  old_value: string | null;
  new_value: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  actor_name?: string;
}

export type SupportRequestSortBy = "created_at" | "updated_at" | "priority";
export type SupportRequestSortDirection = "asc" | "desc";

export interface SupportRequestFilter {
  search?: string;
  userType?: ContactRequestUserType;
  status?: ContactRequestStatus;
  priority?: ContactRequestPriority;
  category?: ContactRequestCategory;
  companyId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: SupportRequestSortBy;
  sortDirection?: SupportRequestSortDirection;
}

export interface SupportContactRequestSummary extends ContactRequest {
  company_name?: string | null;
  company_logo_url?: string | null;
  user_display_name?: string | null;
  user_role?: string | null;
  notes_count?: number;
  events_count?: number;
}

export interface SupportContactRequestDetail extends SupportContactRequestSummary {
  company_website?: string | null;
  user_avatar_url?: string | null;
  notes: ContactRequestNote[];
  events: ContactRequestEvent[];
}

export interface SupportRequestPaginatedResult {
  success: boolean;
  data: SupportContactRequestSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error?: string;
}

export interface SupportRequestStatusUpdateInput {
  status: ContactRequestStatus;
}

export interface SupportRequestPriorityUpdateInput {
  priority: ContactRequestPriority;
}

export interface SupportRequestAssignInput {
  assignedTo: string | null;
}

export interface SupportRequestNoteInput {
  note: string;
}

// =============================================================================
// Sprint 8F: Contact Us Notifications & Communication Types
// =============================================================================

export type ContactNotificationType =
  | "user_confirmation"
  | "support_new_request"
  | "user_status_update";

export type ContactNotificationStatus =
  | "pending"
  | "sent"
  | "failed"
  | "skipped";

export interface ContactNotificationLog {
  id: string;
  contact_request_id: string;
  event_id: string | null;
  notification_type: ContactNotificationType;
  recipient: string;
  subject: string;
  status: ContactNotificationStatus;
  provider: string;
  provider_message_id: string | null;
  error_message: string | null;
  retry_count: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  sent_at: string | null;
}

