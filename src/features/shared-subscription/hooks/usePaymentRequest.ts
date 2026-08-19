"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AccountType,
  CreatePaymentRequestInput,
  PaymentRequestDisplayInfo,
  PaymentRequestRecord,
} from "../types/subscription.types";
import { paymentRequestService } from "../services/paymentRequestService";
import {
  findActivePendingPaymentRequest,
  getPaymentRequestDisplayStatus,
  isPaymentRequestExpired,
} from "../utils/paymentRequestUtils";

export function usePaymentRequest(accountType: AccountType) {
  const [currentRequest, setCurrentRequest] = useState<PaymentRequestRecord | null>(null);
  const [history, setHistory] = useState<PaymentRequestRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentRequestService.getPaymentRequestsForAccount(accountType);
      if (res.success) {
        setHistory(res.data);
        const active = findActivePendingPaymentRequest(res.data);
        setCurrentRequest(active);
      } else {
        setError(res.error);
      }
    } catch {
      setError("Failed to load payment requests.");
    } finally {
      setLoading(false);
    }
  }, [accountType]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isExpired = isPaymentRequestExpired(currentRequest);
  const displayStatus: PaymentRequestDisplayInfo = getPaymentRequestDisplayStatus(currentRequest);

  const createRequest = useCallback(
    async (
      input: Omit<CreatePaymentRequestInput, "accountType">,
    ): Promise<{ success: boolean; data?: PaymentRequestRecord; error?: string }> => {
      setLoading(true);
      setError(null);
      try {
        const res = await paymentRequestService.createPaymentRequest({
          ...input,
          accountType,
        });

        if (res.success) {
          setCurrentRequest(res.data);
          await refresh();
          return { success: true, data: res.data };
        } else {
          setError(res.error);
          return { success: false, error: res.error };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to create payment request.";
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [accountType, refresh],
  );

  return {
    currentRequest,
    history,
    loading,
    error,
    isExpired,
    displayStatus,
    createRequest,
    refresh,
  };
}
