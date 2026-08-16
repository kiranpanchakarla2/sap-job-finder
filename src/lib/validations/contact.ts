import { z } from "zod";
import { CONTACT_ATTACHMENT_CONFIG, CONTACT_REQUEST_CATEGORIES } from "@/lib/constants";
import type { ContactRequestCategory } from "@/types/contact";

const categoryValues = CONTACT_REQUEST_CATEGORIES.map((c) => c.value) as [
  ContactRequestCategory,
  ...ContactRequestCategory[],
];

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter your name.")
    .max(150, "Name must not exceed 150 characters."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .max(255, "Email must not exceed 255 characters.")
    .email("Please enter a valid email address.")
    .toLowerCase(),
  category: z.enum(categoryValues, {
    message: "Please select a category.",
  }),
  subject: z
    .string()
    .trim()
    .min(1, "Please enter a subject.")
    .max(250, "Subject must not exceed 250 characters."),
  message: z
    .string()
    .trim()
    .min(5, "Please enter at least 5 characters for your message.")
    .max(5000, "Message must not exceed 5,000 characters."),
  /** Honeypot anti-spam field (should remain empty for legitimate users) */
  website_hp: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export interface ContactAttachmentState {
  file: File | null;
  name: string;
  size: number;
  error?: string | null;
}

/**
 * Validates a selected file locally before submission
 */
export function validateContactFile(file: File): { valid: boolean; error?: string } {
  if (!file || file.size === 0) {
    return {
      valid: false,
      error: "Selected file is empty (0 bytes). Please choose a valid file.",
    };
  }

  if (file.size > CONTACT_ATTACHMENT_CONFIG.maxSizeBytes) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds the maximum allowed limit of ${CONTACT_ATTACHMENT_CONFIG.maxSizeLabel}.`,
    };
  }

  const fileExt = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
  const isAllowedMime = (CONTACT_ATTACHMENT_CONFIG.allowedMimeTypes as readonly string[]).includes(
    file.type,
  );
  const isAllowedExt = (CONTACT_ATTACHMENT_CONFIG.allowedExtensions as readonly string[]).includes(
    fileExt,
  );

  if (!isAllowedMime && !isAllowedExt) {
    return {
      valid: false,
      error:
        "Unsupported file format. Please upload PDF, images (PNG, JPG), Word (DOC, DOCX), Excel (XLS, XLSX), or TXT documents.",
    };
  }

  return { valid: true };
}

/**
 * Formats byte size into human readable string (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// =============================================================================
// Sprint 8E: Support Operations Validation Schemas
// =============================================================================

export const supportRequestStatusSchema = z.object({
  status: z.enum(["new", "in_progress", "resolved", "closed"], {
    message: "Status must be new, in_progress, resolved, or closed.",
  }),
});

export const supportRequestPrioritySchema = z.object({
  priority: z.enum(["low", "normal", "high", "urgent"], {
    message: "Priority must be low, normal, high, or urgent.",
  }),
});

export const supportRequestAssignSchema = z.object({
  assignedTo: z.string().uuid("Invalid user ID format for assignment.").nullable(),
});

export const supportRequestNoteSchema = z.object({
  note: z
    .string()
    .trim()
    .min(1, "Internal note cannot be empty.")
    .max(5000, "Internal note cannot exceed 5,000 characters."),
});

export const supportRequestFilterSchema = z.object({
  search: z.string().trim().optional(),
  userType: z.enum(["anonymous", "candidate", "employer"]).optional(),
  status: z.enum(["new", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  category: z.enum(categoryValues).optional(),
  companyId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["created_at", "updated_at", "priority"]).default("created_at"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
