"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { getPlanDefinition } from "../config/planRules";
import type { EmployerSubscription, Invoice } from "../types/subscription.types";
import { InvoiceTable } from "./InvoiceTable";

function formatDisplayDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
}

export function BillingSection({
  subscription,
}: {
  subscription: EmployerSubscription;
}) {
  const plan = getPlanDefinition(subscription.planId);

  const onInvoiceAction = (action: "view" | "download", invoice: Invoice) => {
    toast.message(
      action === "view"
        ? "Invoice viewing will be available soon."
        : "Invoice download will be available soon.",
      { description: invoice.label },
    );
  };

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-text">Billing</h2>
      <p className="mt-1 text-sm text-muted">
        Review your billing details and invoice history.
      </p>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
            Current plan
          </dt>
          <dd className="mt-1 text-sm font-medium text-text">{plan.name}</dd>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
            Billing cycle
          </dt>
          <dd className="mt-1 text-sm font-medium capitalize text-text">
            {subscription.billingCycle}
          </dd>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
            Next billing date
          </dt>
          <dd className="mt-1 text-sm font-medium text-text">
            {formatDisplayDate(subscription.nextBillingDate)}
          </dd>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
            Payment method
          </dt>
          <dd className="mt-1 text-sm font-medium text-text">
            {subscription.paymentMethodConfigured
              ? "Configured"
              : "Not configured"}
          </dd>
        </div>
      </dl>

      {!subscription.paymentMethodConfigured ? (
        <div className="mt-4 rounded-xl border border-border bg-surface/40 px-4 py-4">
          <p className="text-sm font-medium text-text">
            No payment method configured.
          </p>
          <p className="mt-1 text-sm text-muted">
            Payment method setup will be available when billing is connected.
          </p>
          <div className="mt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                toast.message("Payment integration coming soon.", {
                  description: "Add Payment Method is UI-only in Sprint 6A.",
                })
              }
            >
              Add Payment Method
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-text">Invoice history</h3>
        <InvoiceTable
          invoices={subscription.invoices}
          onView={(invoice) => onInvoiceAction("view", invoice)}
          onDownload={(invoice) => onInvoiceAction("download", invoice)}
        />
      </div>
    </section>
  );
}
