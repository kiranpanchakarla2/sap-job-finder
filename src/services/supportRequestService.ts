/**
 * Support Operations Service Layer (Sprint 8E)
 * Provides privileged internal operations for searching, filtering, sorting,
 * inspecting, assigning, updating status/priority, adding internal notes,
 * and accessing attachments for contact requests.
 *
 * NOTE: Privileged operations enforce administrator permissions at both the
 * API and database level (RLS & RPC security boundaries).
 */

import { createClient } from "@/lib/supabase/client";
import { CONTACT_ATTACHMENT_CONFIG } from "@/lib/constants";
import type {
  ContactRequest,
  ContactRequestStatus,
  ContactRequestPriority,
  ContactRequestNote,
  ContactRequestEvent,
  SupportRequestFilter,
  SupportRequestPaginatedResult,
  SupportContactRequestDetail,
} from "@/types/contact";

/**
 * Normalizes and formats error messages from Supabase or network exceptions.
 */
function handleServiceError(error: unknown, fallbackMessage: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = String((error as { message: unknown }).message);
    if (msg.includes("42501") || msg.toLowerCase().includes("administrator privileges") || msg.toLowerCase().includes("access denied")) {
      return "Access denied: Support operations require administrator privileges.";
    }
    return msg;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallbackMessage;
}

/**
 * Dispatches background status update notification asynchronously.
 */
function dispatchStatusNotification(payload: {
  type: "status_update";
  contactRequest: ContactRequest;
  newStatus: ContactRequestStatus;
}) {
  try {
    if (typeof window !== "undefined" && typeof fetch === "function") {
      fetch("/api/contact/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.warn("[SupportRequestService] Background status notification failed:", err);
      });
    }
  } catch (err) {
    console.warn("[SupportRequestService] Failed to dispatch status notification:", err);
  }
}

/**
 * Searches, filters, sorts, and paginates contact requests for internal support triage.
 */
export async function getSupportRequests(
  filter: SupportRequestFilter = {}
): Promise<SupportRequestPaginatedResult> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc("get_support_requests", {
      p_search: filter.search?.trim() || null,
      p_user_type: filter.userType || null,
      p_status: filter.status || null,
      p_priority: filter.priority || null,
      p_category: filter.category || null,
      p_company_id: filter.companyId || null,
      p_date_from: filter.dateFrom || null,
      p_date_to: filter.dateTo || null,
      p_page: filter.page ?? 1,
      p_page_size: filter.pageSize ?? 20,
      p_sort_by: filter.sortBy ?? "created_at",
      p_sort_direction: filter.sortDirection ?? "desc",
    });

    if (error) {
      console.error("[SupportRequestService] Error fetching support requests:", error);
      return {
        success: false,
        data: [],
        total: 0,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
        totalPages: 0,
        error: handleServiceError(error, "Failed to fetch support requests."),
      };
    }

    const payload = data as {
      data: SupportContactRequestDetail[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    } | null;

    return {
      success: true,
      data: payload?.data ?? [],
      total: Number(payload?.total ?? 0),
      page: Number(payload?.page ?? 1),
      pageSize: Number(payload?.pageSize ?? 20),
      totalPages: Number(payload?.totalPages ?? 0),
    };
  } catch (err: unknown) {
    console.error("[SupportRequestService] Exception in getSupportRequests:", err);
    return {
      success: false,
      data: [],
      total: 0,
      page: filter.page ?? 1,
      pageSize: filter.pageSize ?? 20,
      totalPages: 0,
      error: handleServiceError(err, "An unexpected error occurred while searching requests."),
    };
  }
}

/**
 * Retrieves a single contact request with full detail including context,
 * internal notes history, and audit events.
 */
export async function getSupportRequestById(id: string): Promise<{
  success: boolean;
  data?: SupportContactRequestDetail | null;
  error?: string;
}> {
  try {
    if (!id) {
      return { success: false, error: "Request ID is required." };
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_support_request_by_id", {
      p_id: id,
    });

    if (error) {
      console.error("[SupportRequestService] Error fetching request detail:", error);
      return {
        success: false,
        error: handleServiceError(error, "Failed to retrieve support request details."),
      };
    }

    return {
      success: true,
      data: (data as unknown as SupportContactRequestDetail) ?? null,
    };
  } catch (err: unknown) {
    console.error("[SupportRequestService] Exception in getSupportRequestById:", err);
    return {
      success: false,
      error: handleServiceError(err, "An unexpected error occurred while loading request detail."),
    };
  }
}

/**
 * Updates the triage status of a contact request.
 * Validates transition lifecycle rules.
 */
export async function updateSupportRequestStatus(
  id: string,
  status: ContactRequestStatus
): Promise<{
  success: boolean;
  data?: ContactRequest;
  error?: string;
}> {
  try {
    if (!id) {
      return { success: false, error: "Request ID is required." };
    }
    if (!["new", "in_progress", "resolved", "closed"].includes(status)) {
      return { success: false, error: `Invalid status "${status}".` };
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc("update_support_request_status", {
      p_id: id,
      p_status: status,
    });

    if (error) {
      console.error("[SupportRequestService] Error updating status:", error);
      return {
        success: false,
        error: handleServiceError(error, "Failed to update request status."),
      };
    }

    const updatedRecord = data as unknown as ContactRequest;

    // Dispatch status update notification in background
    dispatchStatusNotification({
      type: "status_update",
      contactRequest: updatedRecord,
      newStatus: status,
    });

    return {
      success: true,
      data: updatedRecord,
    };
  } catch (err: unknown) {
    console.error("[SupportRequestService] Exception in updateSupportRequestStatus:", err);
    return {
      success: false,
      error: handleServiceError(err, "An unexpected error occurred while updating status."),
    };
  }
}

/**
 * Updates the urgency priority of a contact request.
 */
export async function updateSupportRequestPriority(
  id: string,
  priority: ContactRequestPriority
): Promise<{
  success: boolean;
  data?: ContactRequest;
  error?: string;
}> {
  try {
    if (!id) {
      return { success: false, error: "Request ID is required." };
    }
    if (!["low", "normal", "high", "urgent"].includes(priority)) {
      return { success: false, error: `Invalid priority "${priority}".` };
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc("update_support_request_priority", {
      p_id: id,
      p_priority: priority,
    });

    if (error) {
      console.error("[SupportRequestService] Error updating priority:", error);
      return {
        success: false,
        error: handleServiceError(error, "Failed to update request priority."),
      };
    }

    return {
      success: true,
      data: data as unknown as ContactRequest,
    };
  } catch (err: unknown) {
    console.error("[SupportRequestService] Exception in updateSupportRequestPriority:", err);
    return {
      success: false,
      error: handleServiceError(err, "An unexpected error occurred while updating priority."),
    };
  }
}

/**
 * Assigns or unassigns a contact request to an internal support team member.
 */
export async function assignSupportRequest(
  id: string,
  assignedTo: string | null
): Promise<{
  success: boolean;
  data?: ContactRequest;
  error?: string;
}> {
  try {
    if (!id) {
      return { success: false, error: "Request ID is required." };
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc("assign_support_request", {
      p_id: id,
      p_assigned_to: assignedTo || null,
    });

    if (error) {
      console.error("[SupportRequestService] Error assigning request:", error);
      return {
        success: false,
        error: handleServiceError(error, "Failed to assign request."),
      };
    }

    return {
      success: true,
      data: data as unknown as ContactRequest,
    };
  } catch (err: unknown) {
    console.error("[SupportRequestService] Exception in assignSupportRequest:", err);
    return {
      success: false,
      error: handleServiceError(err, "An unexpected error occurred while assigning request."),
    };
  }
}

/**
 * Appends an internal note to a contact request.
 * Internal notes are private and never exposed to candidates, employers, or anonymous users.
 */
export async function addSupportRequestInternalNote(
  requestId: string,
  note: string
): Promise<{
  success: boolean;
  data?: ContactRequestNote;
  error?: string;
}> {
  try {
    const trimmed = note?.trim();
    if (!requestId) {
      return { success: false, error: "Request ID is required." };
    }
    if (!trimmed) {
      return { success: false, error: "Internal note cannot be empty." };
    }
    if (trimmed.length > 5000) {
      return { success: false, error: "Internal note cannot exceed 5000 characters." };
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc("add_support_request_note", {
      p_id: requestId,
      p_note: trimmed,
    });

    if (error) {
      console.error("[SupportRequestService] Error adding internal note:", error);
      return {
        success: false,
        error: handleServiceError(error, "Failed to add internal note."),
      };
    }

    return {
      success: true,
      data: data as unknown as ContactRequestNote,
    };
  } catch (err: unknown) {
    console.error("[SupportRequestService] Exception in addSupportRequestInternalNote:", err);
    return {
      success: false,
      error: handleServiceError(err, "An unexpected error occurred while adding internal note."),
    };
  }
}

/**
 * Fetches all internal notes for a contact request.
 */
export async function getSupportRequestNotes(requestId: string): Promise<{
  success: boolean;
  data?: ContactRequestNote[];
  error?: string;
}> {
  try {
    if (!requestId) {
      return { success: false, error: "Request ID is required." };
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("contact_request_notes")
      .select("*")
      .eq("contact_request_id", requestId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[SupportRequestService] Error fetching notes:", error);
      return {
        success: false,
        error: handleServiceError(error, "Failed to fetch internal notes."),
      };
    }

    return {
      success: true,
      data: (data as unknown as ContactRequestNote[]) ?? [],
    };
  } catch (err: unknown) {
    console.error("[SupportRequestService] Exception in getSupportRequestNotes:", err);
    return {
      success: false,
      error: handleServiceError(err, "An unexpected error occurred while fetching notes."),
    };
  }
}

/**
 * Fetches the audit trail event history for a contact request.
 */
export async function getSupportRequestEvents(requestId: string): Promise<{
  success: boolean;
  data?: ContactRequestEvent[];
  error?: string;
}> {
  try {
    if (!requestId) {
      return { success: false, error: "Request ID is required." };
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("contact_request_events")
      .select("*")
      .eq("contact_request_id", requestId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[SupportRequestService] Error fetching events:", error);
      return {
        success: false,
        error: handleServiceError(error, "Failed to fetch audit events."),
      };
    }

    return {
      success: true,
      data: (data as unknown as ContactRequestEvent[]) ?? [],
    };
  } catch (err: unknown) {
    console.error("[SupportRequestService] Exception in getSupportRequestEvents:", err);
    return {
      success: false,
      error: handleServiceError(err, "An unexpected error occurred while fetching events."),
    };
  }
}

/**
 * Creates a temporary signed URL for authorized support personnel to inspect private attachments.
 */
export async function getSupportAttachmentSignedUrl(
  filePath: string,
  expiresInSeconds = 3600
): Promise<{
  success: boolean;
  signedUrl?: string;
  error?: string;
}> {
  try {
    if (!filePath) {
      return { success: false, error: "Attachment file path is required." };
    }

    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(CONTACT_ATTACHMENT_CONFIG.bucketName)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      console.error("[SupportRequestService] Error creating signed URL:", error);
      return {
        success: false,
        error: error?.message || "Failed to generate attachment access link.",
      };
    }

    return {
      success: true,
      signedUrl: data.signedUrl,
    };
  } catch (err: unknown) {
    console.error("[SupportRequestService] Exception in getSupportAttachmentSignedUrl:", err);
    return {
      success: false,
      error: handleServiceError(err, "An unexpected error occurred while generating attachment link."),
    };
  }
}
