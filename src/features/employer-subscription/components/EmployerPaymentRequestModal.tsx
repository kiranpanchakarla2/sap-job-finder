"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  MessageSquare,
  Sparkles,
  TrendingDown,
  User,
  X,
} from "lucide-react";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import {
  calculateSavings,
  formatCurrency,
  getBillingCycleMetadata,
  getPlanPrice,
  paymentRequestService,
  type BillingCycle,
  type PaymentRequestRecord,
} from "@/features/shared-subscription";
import { getPlanDefinition } from "../config/planRules";
import type { PlanId } from "../types/subscription.types";

interface EmployerPaymentRequestModalProps {
  open: boolean;
  targetPlanId: PlanId | null;
  billingCycle: BillingCycle;
  companyName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EmployerPaymentRequestModal({
  open,
  targetPlanId,
  billingCycle,
  companyName,
  onClose,
  onSuccess,
}: EmployerPaymentRequestModalProps) {
  const { user, profile } = useAuth();
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const [step, setStep] = useState<"form" | "submitting" | "success">("form");
  const [contactName, setContactName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<PaymentRequestRecord | null>(null);

  const targetPlan = targetPlanId ? getPlanDefinition(targetPlanId) : null;
  const cycleMeta = getBillingCycleMetadata(billingCycle);

  // Derive authoritative price & savings
  const price = targetPlan
    ? getPlanPrice(
        {
          priceMonthly: targetPlan.priceMonthly,
          priceQuarterly: targetPlan.priceQuarterly ?? targetPlan.priceMonthly * 3,
          priceYearly: targetPlan.priceYearly ?? targetPlan.priceMonthly * 12,
        },
        billingCycle,
      )
    : 0;

  const savings = targetPlan
    ? calculateSavings(targetPlan.priceMonthly, price, billingCycle)
    : null;

  // Pre-fill user & company data when modal opens
  useEffect(() => {
    if (open) {
      setStep("form");
      setErrorMsg(null);
      setCreatedRequest(null);

      const defaultName =
        user?.name ||
        (profile
          ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
          : "");
      setContactName(defaultName);

      const defaultPhone = user?.phone || profile?.phone || "";
      setWhatsappNumber(defaultPhone);
      setNotes("");

      previouslyFocused.current = document.activeElement as HTMLElement | null;
      const panel = panelRef.current;
      const focusables = panel ? getFocusableElements(panel) : [];
      window.requestAnimationFrame(() => {
        (focusables[0] ?? panel)?.focus({ preventScroll: true });
      });

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape" && step !== "submitting") {
          event.preventDefault();
          onClose();
          return;
        }
        if (panel) trapFocus(event, panel);
      };

      window.addEventListener("keydown", onKeyDown);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
        previouslyFocused.current?.focus({ preventScroll: true });
      };
    }
  }, [open, user, profile, onClose, step]);

  const validatePhone = (num: string): boolean => {
    // Phone validation: digits, plus sign, spaces, hyphens. Between 8 and 15 digits.
    const digitsOnly = num.replace(/\D/g, "");
    return digitsOnly.length >= 8 && digitsOnly.length <= 15;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPlanId || !targetPlan) return;

    if (!whatsappNumber.trim()) {
      setErrorMsg("WhatsApp number is required to receive payment instructions.");
      return;
    }

    if (!validatePhone(whatsappNumber)) {
      setErrorMsg("Please enter a valid phone number (e.g. +91 98765 43210).");
      return;
    }

    setErrorMsg(null);
    setStep("submitting");

    try {
      const res = await paymentRequestService.createEmployerPaymentRequest({
        planId: targetPlan.id,
        billingCycle,
        whatsappNumber: whatsappNumber.trim(),
        contactName: contactName.trim() || undefined,
        email: user?.email || undefined,
        companyName: companyName || undefined,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setCreatedRequest(res.data);
        setStep("success");
        if (res.data.isExisting) {
          toast.info("Existing Payment Request Found", {
            description: `An active payment request already exists for ${targetPlan.name} (${cycleMeta.displayName}).`,
          });
        } else {
          toast.success("Payment Request Submitted", {
            description: `We've received your request for ${targetPlan.name}. Our team will contact you on WhatsApp with payment details.`,
          });
        }
      } else {
        setStep("form");
        setErrorMsg(res.error || "Unable to submit payment request. Please try again.");
      }
    } catch {
      setStep("form");
      setErrorMsg("A network error occurred. Please check your connection and try again.");
    }
  };

  const handleDone = () => {
    onSuccess?.();
    onClose();
  };

  const displayCompanyName = companyName || createdRequest?.companyName || "Your Company";

  return (
    <AnimatePresence>
      {open && targetPlan ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <motion.button
            type="button"
            aria-label="Dismiss dialog"
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            onClick={() => {
              if (step !== "submitting") onClose();
            }}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
            className="relative z-10 w-full max-w-lg rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-lift max-h-[90vh] overflow-y-auto"
          >
            {/* CLOSE BUTTON */}
            {step !== "submitting" && (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-muted hover:bg-surface hover:text-text focus-visible:outline-2 focus-visible:outline-primary transition"
                aria-label="Close dialog"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}

            {step === "success" ? (
              /* SUCCESS STATE */
              <div className="space-y-6 text-center py-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={32} aria-hidden="true" />
                </div>

                <div className="space-y-1">
                  <h2 id={titleId} className="text-xl font-bold tracking-tight text-text">
                    Subscription Request Submitted
                  </h2>
                  <p id={descriptionId} className="text-xs text-muted">
                    We&apos;ve received your subscription request.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-surface/70 p-4 text-left space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-border pb-2.5">
                    <span className="text-muted">Company</span>
                    <span className="font-semibold text-text">{displayCompanyName}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs border-b border-border pb-2.5">
                    <span className="text-muted">Selected Plan</span>
                    <span className="font-semibold text-text">{targetPlan.name}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs border-b border-border pb-2.5">
                    <span className="text-muted">Billing Period</span>
                    <span className="font-semibold text-text">{cycleMeta.displayName}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs border-b border-border pb-2.5">
                    <span className="text-muted">Total Amount</span>
                    <span className="font-bold text-text text-sm">
                      {formatCurrency(createdRequest?.amount ?? price, targetPlan.currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Status</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      <Clock size={11} aria-hidden="true" />
                      Payment request pending
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-left text-xs text-text flex items-start gap-2.5">
                  <MessageSquare size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                  <p className="leading-relaxed">
                    We&apos;ll contact you on WhatsApp at{" "}
                    <strong className="font-semibold">{whatsappNumber}</strong> with the payment details.
                    Your company subscription will be activated after payment is confirmed.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleDone}
                  className="w-full theme-btn-primary font-semibold"
                >
                  Done
                </Button>
              </div>
            ) : (
              /* FORM STATE */
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 id={titleId} className="text-xl font-bold tracking-tight text-text">
                    Request Subscription
                  </h2>
                  <p id={descriptionId} className="mt-1 text-xs text-muted">
                    Submit your company details to receive a payment link via WhatsApp.
                  </p>
                </div>

                {/* PLAN SUMMARY BOX */}
                <div className="rounded-xl border border-border bg-surface/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-text">{targetPlan.name} Plan</h3>
                        {targetPlan.badge && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            <Sparkles size={10} aria-hidden="true" />
                            {targetPlan.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted mt-0.5">{cycleMeta.displayName} Billing</p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-extrabold text-text">
                        {formatCurrency(price, targetPlan.currency)}
                      </p>
                      <p className="text-[10px] text-muted">
                        /{cycleMeta.durationMonths === 1 ? "month" : `${cycleMeta.durationMonths} months`}
                      </p>
                    </div>
                  </div>

                  {savings && savings.savings > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      <TrendingDown size={13} aria-hidden="true" />
                      <span>
                        You save {formatCurrency(savings.savings, targetPlan.currency)} ({savings.discountPercentage}%) compared with monthly billing.
                      </span>
                    </div>
                  )}
                </div>

                {/* ERROR ALERT */}
                {errorMsg && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-800 dark:text-rose-300">
                    <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* FORM INPUTS */}
                <div className="space-y-4">
                  {/* COMPANY ENTITY (CLEARLY DISTINGUISHED) */}
                  <div className="rounded-lg border border-border/80 bg-surface/50 p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
                      <Building2 size={14} className="text-primary" aria-hidden="true" />
                      <span>Company Account</span>
                    </div>
                    <div>
                      <input
                        id="employer-company-name"
                        type="text"
                        value={displayCompanyName}
                        readOnly
                        className="w-full rounded-lg border border-border bg-card/60 px-3.5 py-2 text-xs font-medium text-text cursor-not-allowed opacity-90"
                      />
                    </div>
                  </div>

                  {/* CONTACT PERSON SECTION */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
                      <User size={14} className="text-primary" aria-hidden="true" />
                      <span>Contact Details</span>
                    </div>

                    <div>
                      <label htmlFor="employer-contact-name" className="block text-xs font-semibold text-text mb-1">
                        Contact Person Name
                      </label>
                      <input
                        id="employer-contact-name"
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Authorized Company Admin name"
                        className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-xs text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label htmlFor="employer-business-email" className="block text-xs font-semibold text-text mb-1">
                        Business Email
                      </label>
                      <input
                        id="employer-business-email"
                        type="email"
                        value={user?.email || ""}
                        readOnly
                        className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-xs text-muted cursor-not-allowed opacity-80"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="employer-whatsapp" className="block text-xs font-semibold text-text">
                          WhatsApp Number <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-muted">We will send payment link here</span>
                      </div>
                      <input
                        id="employer-whatsapp"
                        type="tel"
                        required
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-xs text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label htmlFor="employer-notes" className="block text-xs font-semibold text-text mb-1">
                        Notes / Billing Remarks <span className="text-muted font-normal">(Optional)</span>
                      </label>
                      <textarea
                        id="employer-notes"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="GSTIN, invoicing notes, or specific company requests..."
                        className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-xs text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* CONFIRMATION / TERMS TEXT */}
                <div className="rounded-lg bg-surface p-3 text-[11px] text-muted leading-relaxed flex items-start gap-2 border border-border/60">
                  <HelpCircle size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                  <p>
                    By submitting this request, you are requesting a payment link for the selected subscription.
                    Your company subscription will be activated after payment is confirmed.
                  </p>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    disabled={step === "submitting"}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={step === "submitting"}
                    className="flex-1 theme-btn-primary font-semibold"
                  >
                    {step === "submitting" ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                        Submitting...
                      </span>
                    ) : (
                      "Request Payment"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
