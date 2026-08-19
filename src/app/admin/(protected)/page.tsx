import Link from "next/link";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Grid,
  History,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  ScrollText,
  Settings,
  Shield,
  ShieldAlert,
  UserRound,
  Users,
} from "lucide-react";
import { ADMIN_NAV_SECTIONS } from "@/features/admin-shell/constants";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
              Super Admin Dashboard
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
              Sprint 10A Foundation
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Administrative analytics and platform metrics will appear here.
          </p>
        </div>
      </div>

      {/* Foundation Status Banner */}
      <div className="rounded-[var(--radius-card)] border border-primary/20 bg-primary/5 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-soft">
            <Shield size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text">
              Super Admin Portal Foundation Active
            </h2>
            <p className="mt-1 text-sm text-muted">
              Secure authentication, authorization guards, internal routing, and navigation architecture have been successfully initialized. Administrative modules are linked below and will be populated in upcoming Sprint 10 increments.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-card border border-border px-2.5 py-1 text-xs font-medium text-text">
                <CheckCircle2 size={13} className="text-emerald-500" />
                Auth Guard: Active
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-card border border-border px-2.5 py-1 text-xs font-medium text-text">
                <CheckCircle2 size={13} className="text-emerald-500" />
                RLS Enforcement: Enabled
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-card border border-border px-2.5 py-1 text-xs font-medium text-text">
                <CheckCircle2 size={13} className="text-emerald-500" />
                Initial Accounts: Provisioned
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Module Overview Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Administrative Modules Overview
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_NAV_SECTIONS.filter((s) => s.title).map((section) => (
            <div
              key={section.title}
              className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft transition hover:border-primary/30"
            >
              <h4 className="text-sm font-semibold text-text mb-3">
                {section.title}
              </h4>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-xs font-medium text-muted hover:text-primary transition"
                    >
                      <span className="flex items-center gap-2">
                        <Icon size={14} className="text-muted group-hover:text-primary" />
                        <span className="text-text group-hover:text-primary">{item.label}</span>
                      </span>
                      <span className="text-[10px] text-muted/70 group-hover:text-primary font-semibold">
                        Ready →
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
