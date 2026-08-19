import { createClient } from "@/lib/supabase/client";
import type {
  AccountType,
  CreateCandidatePaymentRequestInput,
  CreateEmployerPaymentRequestInput,
  CreatePaymentRequestInput,
  PaymentRequestRecord,
  ServiceResult,
} from "../types/subscription.types";
import { isPaymentRequestExpired } from "../utils/paymentRequestUtils";

function mapRowToRecord(row: Record<string, unknown>): PaymentRequestRecord {
  return {
    id: String(row.id),
    accountType: row.account_type as AccountType,
    userId: row.user_id ? String(row.user_id) : null,
    candidateId: row.candidate_id ? String(row.candidate_id) : null,
    companyId: row.company_id ? String(row.company_id) : null,
    planId: String(row.plan_id),
    planName: row.plan_name ? String(row.plan_name) : null,
    billingCycle: row.billing_cycle as PaymentRequestRecord["billingCycle"],
    amount: Number(row.amount),
    currency: (row.currency as PaymentRequestRecord["currency"]) || "INR",
    customerName: String(row.customer_name),
    email: String(row.email),
    whatsappNumber: String(row.whatsapp_number),
    companyName: row.company_name ? String(row.company_name) : null,
    status: (row.status as PaymentRequestRecord["status"]) || "pending",
    notes: row.notes ? String(row.notes) : null,
    paymentLink: row.payment_link ? String(row.payment_link) : null,
    requestedAt: String(row.requested_at),
    expiresAt: row.expires_at ? String(row.expires_at) : null,
    paymentLinkSentAt: row.payment_link_sent_at ? String(row.payment_link_sent_at) : null,
    paymentReceivedAt: row.payment_received_at ? String(row.payment_received_at) : null,
    cancelledAt: row.cancelled_at ? String(row.cancelled_at) : null,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    isExisting: Boolean(row.isExisting),
  };
}

/**
 * Service for managing manual payment requests across Candidate and Employer portals.
 */
export const paymentRequestService = {
  /**
   * Unified payment request creation accepting an explicit account type.
   */
  async createPaymentRequest(
    input: CreatePaymentRequestInput,
  ): Promise<ServiceResult<PaymentRequestRecord>> {
    if (input.accountType === "candidate") {
      return this.createCandidatePaymentRequest({
        planId: input.planId,
        billingCycle: input.billingCycle,
        whatsappNumber: input.whatsappNumber,
        customerName: input.customerName,
        email: input.email,
        notes: input.notes,
      });
    }

    if (input.accountType === "employer") {
      return this.createEmployerPaymentRequest({
        planId: input.planId,
        billingCycle: input.billingCycle,
        whatsappNumber: input.whatsappNumber,
        contactName: input.customerName,
        email: input.email,
        companyName: input.companyName,
        notes: input.notes,
      });
    }

    return { success: false, error: "Invalid account type provided." };
  },

  /**
   * Submits a candidate payment request to Supabase via security definer RPC.
   */
  async createCandidatePaymentRequest(
    input: CreateCandidatePaymentRequestInput,
  ): Promise<ServiceResult<PaymentRequestRecord>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("create_candidate_payment_request", {
        p_plan_id: input.planId,
        p_billing_cycle: input.billingCycle,
        p_whatsapp_number: input.whatsappNumber,
        p_customer_name: input.customerName || null,
        p_email: input.email || null,
        p_notes: input.notes || null,
      });

      if (error) {
        return { success: false, error: error.message || "Failed to submit payment request." };
      }

      const res = data as unknown as Record<string, unknown>;
      const record = mapRowToRecord(res);

      return { success: true, data: record };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create payment request.",
      };
    }
  },

  /**
   * Submits an employer payment request to Supabase via security definer RPC.
   */
  async createEmployerPaymentRequest(
    input: CreateEmployerPaymentRequestInput,
  ): Promise<ServiceResult<PaymentRequestRecord>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("create_employer_payment_request", {
        p_plan_id: input.planId,
        p_billing_cycle: input.billingCycle,
        p_whatsapp_number: input.whatsappNumber,
        p_contact_name: input.contactName || null,
        p_email: input.email || null,
        p_notes: input.notes || null,
      });

      if (error) {
        return { success: false, error: error.message || "Failed to submit payment request." };
      }

      const res = data as unknown as Record<string, unknown>;
      const record = mapRowToRecord(res);

      return { success: true, data: record };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create employer payment request.",
      };
    }
  },

  /**
   * Fetches a specific payment request by ID.
   */
  async getPaymentRequest(id: string): Promise<ServiceResult<PaymentRequestRecord | null>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: true, data: null };
      }

      return { success: true, data: mapRowToRecord(data) };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to load payment request.",
      };
    }
  },

  /**
   * Fetches the latest pending or active payment request for an account type.
   */
  async getPendingPaymentRequest(
    accountType: AccountType,
  ): Promise<ServiceResult<PaymentRequestRecord | null>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("account_type", accountType)
        .in("status", ["pending", "payment_link_sent"])
        .order("requested_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: true, data: null };
      }

      const record = mapRowToRecord(data);
      return { success: true, data: record };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to load pending payment request.",
      };
    }
  },

  /**
   * Fetches payment requests for the currently authenticated candidate.
   */
  async getCandidatePaymentRequests(): Promise<ServiceResult<PaymentRequestRecord[]>> {
    return this.getPaymentRequestsForAccount("candidate");
  },

  /**
   * Fetches payment requests for the currently authenticated employer company.
   */
  async getEmployerPaymentRequests(): Promise<ServiceResult<PaymentRequestRecord[]>> {
    return this.getPaymentRequestsForAccount("employer");
  },

  /**
   * Universal account-level payment request history retriever.
   */
  async getPaymentRequestsForAccount(
    accountType: AccountType,
  ): Promise<ServiceResult<PaymentRequestRecord[]>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("account_type", accountType)
        .order("requested_at", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const rows: PaymentRequestRecord[] = (data || []).map(mapRowToRecord);

      return { success: true, data: rows };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to load payment requests.",
      };
    }
  },
};
