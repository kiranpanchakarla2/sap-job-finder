import type {
  BillingCycle,
  PaymentRequestDisplayInfo,
  PaymentRequestRecord,
  PaymentRequestStatus,
} from "../types/subscription.types";

/**
 * Standard expiration duration in days for manual payment requests.
 */
export const DEFAULT_PAYMENT_REQUEST_EXPIRY_DAYS = 7;

/**
 * Checks whether a payment request is expired.
 */
export function isPaymentRequestExpired(
  request:
    | Pick<PaymentRequestRecord, "expiresAt" | "requestedAt" | "status">
    | null
    | undefined,
  now: Date = new Date(),
): boolean {
  if (!request) return false;

  // Once payment is received or request is cancelled, expiration is no longer actively applicable
  if (request.status === "payment_received" || request.status === "cancelled") {
    return false;
  }

  const nowMs = now.getTime();

  if (request.expiresAt) {
    const expiresMs = new Date(request.expiresAt).getTime();
    if (!isNaN(expiresMs)) {
      return expiresMs < nowMs;
    }
  }

  if (request.requestedAt) {
    const requestedMs = new Date(request.requestedAt).getTime();
    if (!isNaN(requestedMs)) {
      const fallbackExpiresMs =
        requestedMs + DEFAULT_PAYMENT_REQUEST_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      return fallbackExpiresMs < nowMs;
    }
  }

  return false;
}

/**
 * Returns centralized display metadata, friendly user labels, and descriptions for any payment request.
 */
export function getPaymentRequestDisplayStatus(
  request:
    | Pick<PaymentRequestRecord, "status" | "expiresAt" | "requestedAt">
    | null
    | undefined,
  now: Date = new Date(),
): PaymentRequestDisplayInfo {
  if (!request) {
    return {
      status: "pending",
      variant: "pending",
      label: "No Request",
      description: "No active payment request.",
      isExpired: false,
      isActionable: false,
    };
  }

  const expired = isPaymentRequestExpired(request, now);

  if (expired && (request.status === "pending" || request.status === "payment_link_sent")) {
    return {
      status: "expired",
      variant: "expired",
      label: "Payment Request Expired",
      description: "This payment request is no longer valid. You can submit a new request.",
      isExpired: true,
      isActionable: true,
    };
  }

  switch (request.status) {
    case "pending":
      return {
        status: "pending",
        variant: "pending",
        label: "Payment Request Pending",
        description: "We've received your request. We'll contact you on WhatsApp with the payment details.",
        isExpired: false,
        isActionable: false,
      };

    case "payment_link_sent":
      return {
        status: "payment_link_sent",
        variant: "payment_link_sent",
        label: "Payment Link Sent",
        description: "Payment details have been sent to your WhatsApp contact.",
        isExpired: false,
        isActionable: false,
      };

    case "payment_received":
      return {
        status: "payment_received",
        variant: "payment_received",
        label: "Payment Received",
        description: "We've recorded your payment. Your subscription will be activated through the subscription management process.",
        isExpired: false,
        isActionable: false,
      };

    case "cancelled":
      return {
        status: "cancelled",
        variant: "cancelled",
        label: "Payment Request Cancelled",
        description: "This payment request has been cancelled. You can submit a new request.",
        isExpired: false,
        isActionable: true,
      };

    default:
      return {
        status: "pending",
        variant: "pending",
        label: "Payment Request Pending",
        description: "We've received your request. We'll contact you on WhatsApp with the payment details.",
        isExpired: false,
        isActionable: false,
      };
  }
}

/**
 * Checks whether a new payment request can be created, or if an identical active pending request already exists.
 * Duplicate protection context: same plan + same billing cycle + non-expired active request.
 */
export function canCreatePaymentRequest(
  pendingRequest: PaymentRequestRecord | null | undefined,
  targetPlanId: string,
  targetBillingCycle: BillingCycle,
  now: Date = new Date(),
): { allowed: boolean; reason?: "DUPLICATE_PENDING" | "EXPIRED_ALLOWED" | "NONE" } {
  if (!pendingRequest) {
    return { allowed: true, reason: "NONE" };
  }

  // If previous request is cancelled or expired, a new request is allowed
  if (pendingRequest.status === "cancelled" || isPaymentRequestExpired(pendingRequest, now)) {
    return { allowed: true, reason: "EXPIRED_ALLOWED" };
  }

  // If an active request exists for the exact same plan and billing cycle, block duplicate creation
  if (
    (pendingRequest.status === "pending" || pendingRequest.status === "payment_link_sent") &&
    pendingRequest.planId === targetPlanId &&
    pendingRequest.billingCycle === targetBillingCycle
  ) {
    return { allowed: false, reason: "DUPLICATE_PENDING" };
  }

  // If requesting a different plan or billing cycle, allow creating the new request
  return { allowed: true, reason: "NONE" };
}

/**
 * Identifies the latest relevant active payment request from an array of payment requests.
 */
export function findActivePendingPaymentRequest(
  requests: PaymentRequestRecord[],
  now: Date = new Date(),
): PaymentRequestRecord | null {
  if (!requests || requests.length === 0) return null;

  // First check for non-expired pending or payment_link_sent
  const active = requests.find(
    (r) =>
      (r.status === "pending" || r.status === "payment_link_sent") &&
      !isPaymentRequestExpired(r, now),
  );
  if (active) return active;

  // Fallback to most recent request if it is still pending/expired/recently received
  const mostRecent = requests[0];
  if (mostRecent) return mostRecent;

  return null;
}
