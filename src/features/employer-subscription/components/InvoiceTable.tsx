"use client";

import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { Button } from "@/components/ui/Button";
import type { Invoice } from "../types/subscription.types";

function formatDisplayDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function InvoiceTable({
  invoices,
  onView,
  onDownload,
}: {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onDownload: (invoice: Invoice) => void;
}) {
  if (!invoices.length) {
    return (
      <p className="text-sm text-muted">No invoices yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th className="px-3 py-3 font-semibold">Date</th>
            <th className="px-3 py-3 font-semibold">Invoice</th>
            <th className="px-3 py-3 font-semibold">Amount</th>
            <th className="px-3 py-3 font-semibold">Status</th>
            <th className="px-3 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b border-border/70 last:border-0">
              <td className="px-3 py-3.5 text-muted">
                {formatDisplayDate(invoice.date)}
              </td>
              <td className="px-3 py-3.5 font-medium text-text">{invoice.label}</td>
              <td className="px-3 py-3.5 text-muted">
                {formatAmount(invoice.amount, invoice.currency)}
              </td>
              <td className="px-3 py-3.5">
                <StatusBadge
                  tone={
                    invoice.status === "paid"
                      ? "success"
                      : invoice.status === "open"
                        ? "warning"
                        : "muted"
                  }
                >
                  {invoice.status}
                </StatusBadge>
              </td>
              <td className="px-3 py-3.5">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="!px-2 !py-1 text-xs"
                    onClick={() => onView(invoice)}
                  >
                    View
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="!px-2 !py-1 text-xs"
                    onClick={() => onDownload(invoice)}
                  >
                    Download
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
