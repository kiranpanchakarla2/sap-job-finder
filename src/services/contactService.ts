/**
 * Contact Us Service Layer (Sprint 8A Foundation)
 * Provides centralized operations for creating and retrieving contact requests
 * and handling secure private attachment uploads.
 */

import { createClient } from "@/lib/supabase/client";
import { CONTACT_ATTACHMENT_CONFIG } from "@/lib/constants";
import type {
  ContactRequest,
  ContactRequestInsertInput,
  ContactRequestResult,
  ContactAttachmentUploadResult,
} from "@/types/contact";

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/**
 * Dispatches background email notifications asynchronously without blocking the user response.
 */
function dispatchContactNotification(payload: {
  type: "new_request" | "status_update";
  contactRequest: ContactRequest;
  companyName?: string;
}) {
  try {
    if (typeof window !== "undefined" && typeof fetch === "function") {
      fetch("/api/contact/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.warn("[ContactService] Background notification trigger failed:", err);
      });
    }
  } catch (err) {
    console.warn("[ContactService] Failed to dispatch background notification:", err);
  }
}

/**
 * Creates a new contact request for anonymous, candidate, or employer users.
 * Automatically relies on RLS & database triggers to enforce permissions and sanitize internal fields.
 */
export async function createContactRequest(
  input: ContactRequestInsertInput
): Promise<ContactRequestResult> {
  try {
    const name = input.name?.trim();
    const email = input.email?.trim().toLowerCase();
    const subject = input.subject?.trim();
    const message = input.message?.trim();
    const category = input.category;

    if (!name) {
      return { success: false, error: "Name is required." };
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return { success: false, error: "A valid email address is required." };
    }
    if (!category) {
      return { success: false, error: "Category is required." };
    }
    if (!subject) {
      return { success: false, error: "Subject is required." };
    }
    if (!message) {
      return { success: false, error: "Message is required." };
    }

    if (input.attachment_size && input.attachment_size > CONTACT_ATTACHMENT_CONFIG.maxSizeBytes) {
      return {
        success: false,
        error: `Attachment size exceeds the maximum limit of ${CONTACT_ATTACHMENT_CONFIG.maxSizeLabel}.`,
      };
    }

    const supabase = createClient();

    // Check if user is authenticated to pass appropriate initial fields
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const insertPayload = {
      name,
      email,
      category,
      subject,
      message,
      attachment_url: input.attachment_url ?? null,
      attachment_name: input.attachment_name ?? null,
      attachment_size: input.attachment_size ?? null,
      user_id: session?.user?.id ?? null,
      user_type: session?.user ? input.user_type ?? "candidate" : "anonymous",
      company_id: session?.user ? input.company_id ?? null : null,
    };

    if (session?.user) {
      // Authenticated users have SELECT permission on their own rows
      const { data, error } = await supabase
        .from("contact_requests")
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error("[ContactService] Error creating authenticated contact request:", error);
        return {
          success: false,
          error: error.message || "Failed to submit contact request. Please try again.",
        };
      }

      const createdRecord = data as unknown as ContactRequest;

      // Dispatch confirmation & support notification in the background (non-blocking)
      dispatchContactNotification({
        type: "new_request",
        contactRequest: createdRecord,
      });

      return {
        success: true,
        data: createdRecord,
      };
    } else {
      // Anonymous users can insert but cannot SELECT (RLS protects all stored rows from anonymous harvesting)
      const { error } = await supabase
        .from("contact_requests")
        .insert(insertPayload);

      if (error) {
        console.error("[ContactService] Error creating anonymous contact request:", error);
        return {
          success: false,
          error: error.message || "Failed to submit contact request. Please try again.",
        };
      }

      const anonRecord: ContactRequest = {
        id: "",
        user_id: null,
        user_type: "anonymous",
        company_id: null,
        name,
        email,
        category,
        subject,
        message,
        attachment_url: insertPayload.attachment_url,
        attachment_name: insertPayload.attachment_name,
        attachment_size: insertPayload.attachment_size,
        status: "new",
        priority: "normal",
        assigned_to: null,
        admin_notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Dispatch confirmation & support notification in the background (non-blocking)
      dispatchContactNotification({
        type: "new_request",
        contactRequest: anonRecord,
      });

      return {
        success: true,
        data: anonRecord,
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[ContactService] Exception in createContactRequest:", err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Retrieves contact requests submitted by the current authenticated user / company.
 * (RLS restricts results to only own candidate requests or own employer company requests)
 */
export async function getMyContactRequests(): Promise<{
  success: boolean;
  data?: ContactRequest[];
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("contact_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ContactService] Error fetching contact requests:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch contact requests.",
      };
    }

    return {
      success: true,
      data: (data as unknown as ContactRequest[]) ?? [],
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[ContactService] Exception in getMyContactRequests:", err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Retrieves a single contact request by ID.
 * Returns null if not found or unauthorized by RLS.
 */
export async function getContactRequestById(id: string): Promise<{
  success: boolean;
  data?: ContactRequest | null;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("contact_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[ContactService] Error fetching contact request by ID:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch contact request.",
      };
    }

    return {
      success: true,
      data: (data as unknown as ContactRequest) ?? null,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[ContactService] Exception in getContactRequestById:", err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Uploads a file attachment to the private contact-attachments Supabase Storage bucket.
 * Performs client-side validation on file size and allowed MIME types.
 */
export async function uploadContactAttachment(
  file: File,
  options?: { isAnonymous?: boolean }
): Promise<ContactAttachmentUploadResult> {
  try {
    if (!file) {
      return { success: false, error: "No file provided." };
    }

    if (file.size === 0) {
      return { success: false, error: "Selected file is empty (0 bytes). Please upload a valid file." };
    }

    // Size validation
    if (file.size > CONTACT_ATTACHMENT_CONFIG.maxSizeBytes) {
      return {
        success: false,
        error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed limit of ${CONTACT_ATTACHMENT_CONFIG.maxSizeLabel}.`,
      };
    }

    // MIME type validation
    const isAllowedMime = (CONTACT_ATTACHMENT_CONFIG.allowedMimeTypes as readonly string[]).includes(
      file.type
    );
    const fileExt = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
    const isAllowedExt = (CONTACT_ATTACHMENT_CONFIG.allowedExtensions as readonly string[]).includes(
      fileExt
    );

    if (!isAllowedMime && !isAllowedExt) {
      return {
        success: false,
        error: `File type "${file.type || fileExt}" is not supported. Please upload PDF, images (PNG, JPG), Word (DOC, DOCX), Excel (XLS, XLSX), or TXT documents.`,
      };
    }

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const sanitizedName =
      file.name
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/\.+/g, ".")
        .replace(/^\.+/, "") || "attachment";
    const uniquePrefix =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2);

    let filePath: string;
    if (session?.user && !options?.isAnonymous) {
      filePath = `${session.user.id}/${uniquePrefix}-${sanitizedName}`;
    } else {
      filePath = `anonymous/${uniquePrefix}/${sanitizedName}`;
    }

    const { error: uploadError } = await supabase.storage
      .from(CONTACT_ATTACHMENT_CONFIG.bucketName)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[ContactService] Storage upload error:", uploadError);
      return {
        success: false,
        error: uploadError.message || "Failed to upload attachment.",
      };
    }

    return {
      success: true,
      path: filePath,
      name: file.name,
      size: file.size,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred during file upload.";
    console.error("[ContactService] Exception in uploadContactAttachment:", err);
    return { success: false, error: errorMsg };
  }
}
