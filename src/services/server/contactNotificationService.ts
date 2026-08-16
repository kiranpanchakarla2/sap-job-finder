/**
 * Contact Us Server-Side Notification Service (Sprint 8F)
 * Dispatches confirmation emails, support alerts, and status update notifications
 * with server-side database logging and idempotency protection.
 */

import { siteConfig } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { getEmailProvider } from "@/lib/email/providers";
import { userConfirmationTemplate } from "@/lib/email/templates/userConfirmationTemplate";
import { supportNewRequestTemplate } from "@/lib/email/templates/supportNewRequestTemplate";
import { userStatusUpdateTemplate } from "@/lib/email/templates/userStatusUpdateTemplate";
import type { ContactRequest, ContactRequestStatus } from "@/types/contact";
import type { Json } from "@/types/database";

export interface NotificationResult {
  success: boolean;
  logId?: string;
  provider?: string;
  error?: string;
}

/**
 * Returns the configured support team destination email address.
 */
export function getSupportEmailAddress(): string {
  return process.env.SUPPORT_EMAIL?.trim() || siteConfig.supportEmail || "support@sapjobsfinder.com";
}

/**
 * Logs a notification attempt in the database for tracking, retry, and auditing.
 */
async function recordNotificationLog(params: {
  contactRequestId: string;
  notificationType: "user_confirmation" | "support_new_request" | "user_status_update";
  recipient: string;
  subject: string;
  status: "pending" | "sent" | "failed" | "skipped";
  provider: string;
  providerMessageId?: string;
  errorMessage?: string;
  eventId?: string;
  metadata?: Record<string, unknown>;
}): Promise<string | undefined> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("log_contact_notification", {
      p_contact_request_id: params.contactRequestId,
      p_notification_type: params.notificationType,
      p_recipient: params.recipient,
      p_subject: params.subject,
      p_status: params.status,
      p_provider: params.provider,
      p_provider_message_id: params.providerMessageId || null,
      p_error_message: params.errorMessage || null,
      p_event_id: params.eventId || null,
      p_metadata: (params.metadata as Json) ?? {},
    });

    if (error) {
      console.error("[ContactNotificationService] Error recording notification log:", error);
      return undefined;
    }

    const payload = data as { id?: string } | null;
    return payload?.id;
  } catch (err) {
    console.error("[ContactNotificationService] Exception recording notification log:", err);
    return undefined;
  }
}

/**
 * Checks if a specific notification was already sent to avoid duplicate emails.
 */
async function isNotificationAlreadySent(
  contactRequestId: string,
  notificationType: string,
  eventId?: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("check_contact_notification_sent", {
      p_contact_request_id: contactRequestId,
      p_notification_type: notificationType,
      p_event_id: eventId || null,
    });

    if (error) {
      console.warn("[ContactNotificationService] Error checking idempotency, proceeding with send:", error);
      return false;
    }

    return Boolean(data);
  } catch (err) {
    console.warn("[ContactNotificationService] Exception checking idempotency:", err);
    return false;
  }
}

/**
 * Sends a confirmation email to the user upon receiving their Contact Us inquiry.
 */
export async function sendContactRequestConfirmation(
  request: ContactRequest
): Promise<NotificationResult> {
  try {
    if (!request.id || !request.email) {
      return { success: false, error: "Invalid request payload: missing id or email." };
    }

    // Idempotency check: prevent duplicate confirmation emails
    const alreadySent = await isNotificationAlreadySent(request.id, "user_confirmation");
    if (alreadySent) {
      return { success: true, error: "Notification already sent (idempotent skip)." };
    }

    const template = userConfirmationTemplate({
      name: request.name,
      subject: request.subject,
      category: request.category,
      createdAt: request.created_at,
    });

    const provider = getEmailProvider();
    const result = await provider.send({
      to: request.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo: getSupportEmailAddress(),
    });

    const logId = await recordNotificationLog({
      contactRequestId: request.id,
      notificationType: "user_confirmation",
      recipient: request.email,
      subject: template.subject,
      status: result.success ? "sent" : "failed",
      provider: result.provider,
      providerMessageId: result.messageId,
      errorMessage: result.error,
      metadata: {
        user_type: request.user_type,
        category: request.category,
      },
    });

    return {
      success: result.success,
      logId,
      provider: result.provider,
      error: result.error,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unexpected error in sendContactRequestConfirmation";
    console.error("[ContactNotificationService] Exception in sendContactRequestConfirmation:", err);

    if (request.id && request.email) {
      await recordNotificationLog({
        contactRequestId: request.id,
        notificationType: "user_confirmation",
        recipient: request.email,
        subject: `Confirmation for ${request.subject}`,
        status: "failed",
        provider: "error",
        errorMessage: errorMsg,
      });
    }

    return { success: false, error: errorMsg };
  }
}

/**
 * Sends an internal alert email to the support team when a new request is created.
 */
export async function sendNewContactRequestNotification(
  request: ContactRequest,
  companyName?: string | null
): Promise<NotificationResult> {
  try {
    if (!request.id) {
      return { success: false, error: "Invalid request payload: missing id." };
    }

    const supportEmail = getSupportEmailAddress();

    // Idempotency check: prevent duplicate internal alerts
    const alreadySent = await isNotificationAlreadySent(request.id, "support_new_request");
    if (alreadySent) {
      return { success: true, error: "Support alert already sent (idempotent skip)." };
    }

    const template = supportNewRequestTemplate({
      userType: request.user_type,
      name: request.name,
      email: request.email,
      category: request.category,
      subject: request.subject,
      message: request.message,
      companyName,
      attachmentName: request.attachment_name,
      createdAt: request.created_at,
      requestId: request.id,
    });

    const provider = getEmailProvider();
    const result = await provider.send({
      to: supportEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo: request.email,
    });

    const logId = await recordNotificationLog({
      contactRequestId: request.id,
      notificationType: "support_new_request",
      recipient: supportEmail,
      subject: template.subject,
      status: result.success ? "sent" : "failed",
      provider: result.provider,
      providerMessageId: result.messageId,
      errorMessage: result.error,
      metadata: {
        user_type: request.user_type,
        category: request.category,
        has_attachment: Boolean(request.attachment_name),
      },
    });

    return {
      success: result.success,
      logId,
      provider: result.provider,
      error: result.error,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unexpected error in sendNewContactRequestNotification";
    console.error("[ContactNotificationService] Exception in sendNewContactRequestNotification:", err);

    if (request.id) {
      await recordNotificationLog({
        contactRequestId: request.id,
        notificationType: "support_new_request",
        recipient: getSupportEmailAddress(),
        subject: `New Request: ${request.subject}`,
        status: "failed",
        provider: "error",
        errorMessage: errorMsg,
      });
    }

    return { success: false, error: errorMsg };
  }
}

/**
 * Sends a notification email to the requester when their inquiry status is updated.
 * (Only meaningful user-facing status transitions trigger this notification).
 */
export async function sendContactRequestStatusNotification(
  request: ContactRequest,
  newStatus: ContactRequestStatus,
  oldStatus?: ContactRequestStatus,
  eventId?: string
): Promise<NotificationResult> {
  try {
    if (!request.id || !request.email) {
      return { success: false, error: "Invalid request payload: missing id or email." };
    }

    // Do not email if status has not changed
    if (oldStatus && oldStatus === newStatus) {
      return { success: true, error: "Status unchanged, no notification needed." };
    }

    // Idempotency check with eventId if available
    if (eventId) {
      const alreadySent = await isNotificationAlreadySent(request.id, "user_status_update", eventId);
      if (alreadySent) {
        return { success: true, error: "Status update notification already sent (idempotent skip)." };
      }
    }

    const template = userStatusUpdateTemplate({
      name: request.name,
      subject: request.subject,
      oldStatus,
      newStatus,
      createdAt: request.created_at,
    });

    const provider = getEmailProvider();
    const result = await provider.send({
      to: request.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo: getSupportEmailAddress(),
    });

    const logId = await recordNotificationLog({
      contactRequestId: request.id,
      eventId,
      notificationType: "user_status_update",
      recipient: request.email,
      subject: template.subject,
      status: result.success ? "sent" : "failed",
      provider: result.provider,
      providerMessageId: result.messageId,
      errorMessage: result.error,
      metadata: {
        old_status: oldStatus,
        new_status: newStatus,
      },
    });

    return {
      success: result.success,
      logId,
      provider: result.provider,
      error: result.error,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unexpected error in sendContactRequestStatusNotification";
    console.error("[ContactNotificationService] Exception in sendContactRequestStatusNotification:", err);

    if (request.id && request.email) {
      await recordNotificationLog({
        contactRequestId: request.id,
        eventId,
        notificationType: "user_status_update",
        recipient: request.email,
        subject: `Status Update: ${request.subject}`,
        status: "failed",
        provider: "error",
        errorMessage: errorMsg,
      });
    }

    return { success: false, error: errorMsg };
  }
}
