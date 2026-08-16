"use client";

import { useState } from "react";
import {
  Briefcase,
  Building2,
  Clock,
  FileSpreadsheet,
  HelpCircle,
  History,
  LifeBuoy,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import { EmployerContactForm } from "./EmployerContactForm";
import { EmployerRequestHistory } from "./EmployerRequestHistory";
import type { ContactRequestCategory } from "@/types/contact";

export interface EmployerContactViewProps {
  initialCategory?: ContactRequestCategory;
  initialSubject?: string;
  initialMessage?: string;
  jobId?: string;
  jobTitle?: string;
}

export function EmployerContactView({
  initialCategory,
  initialSubject,
  initialMessage,
  jobId,
  jobTitle,
}: EmployerContactViewProps) {
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* Employer Page Header */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-surface to-card p-6 sm:p-8 lg:p-10 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <LifeBuoy size={14} aria-hidden="true" />
              <span>Employer Help & Support</span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-text sm:text-3xl lg:text-4xl">
              How can we help your business?
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
              Need help managing your company, jobs, candidates, or SAP Jobs Finder account?
              Send us a message and our team will help.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="inline-flex shrink-0 rounded-2xl border border-border bg-background p-1.5 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab("form")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === "form"
                  ? "bg-primary text-white shadow-soft"
                  : "text-muted hover:text-text"
              }`}
            >
              <Send size={14} aria-hidden="true" />
              <span>Send a Message</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === "history"
                  ? "bg-primary text-white shadow-soft"
                  : "text-muted hover:text-text"
              }`}
            >
              <History size={14} aria-hidden="true" />
              <span>My Requests</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Main Content (Left: 8 cols) */}
        <div className="lg:col-span-8">
          {activeTab === "form" ? (
            <EmployerContactForm
              initialCategory={initialCategory}
              initialSubject={initialSubject}
              initialMessage={initialMessage}
              contextJobId={jobId}
              contextJobTitle={jobTitle}
              onViewRequests={() => setActiveTab("history")}
            />
          ) : (
            <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft sm:p-8">
              <EmployerRequestHistory onNewRequest={() => setActiveTab("form")} />
            </div>
          )}
        </div>

        {/* Sidebar Info & Common Topics (Right: 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick FAQ / Guidance Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-text">
              <HelpCircle size={16} className="text-primary" aria-hidden="true" />
              <span>Common Employer Topics</span>
            </h3>

            <div className="mt-4 space-y-3.5 text-xs text-muted">
              <div className="flex items-start gap-2.5">
                <FileSpreadsheet size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-text">Bulk Excel Import</p>
                  <p className="mt-0.5">Assistance with spreadsheet templates, row validation errors, or bulk upload limit inquiries.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Search size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-text">Talent Search & Sourcing</p>
                  <p className="mt-0.5">Need help identifying certified SAP talent, setting search filters, or viewing candidate profiles.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Briefcase size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-text">Job Listings & Applications</p>
                  <p className="mt-0.5">Assistance publishing roles, updating job requirements, or managing candidate applicant workflows.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Building2 size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-text">Company Profile & Team</p>
                  <p className="mt-0.5">Update branding, company description, recruiter details, or manage team member invitations.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-text">Subscriptions & Billing</p>
                  <p className="mt-0.5">Inquiries about employer subscription plans, invoices, payment methods, or feature upgrades.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Response Time SLA Card */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-soft text-xs text-text">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Clock size={16} aria-hidden="true" />
              <span>Dedicated Employer Support</span>
            </div>

            <p className="mt-2 text-muted leading-relaxed">
              Our employer support specialists review business requests Monday through Friday.
              You will receive updates directly at your company&apos;s registered work email address.
            </p>

            <div className="mt-4 border-t border-primary/15 pt-3 flex items-center justify-between text-[11px] text-muted">
              <span>Avg. Response Time:</span>
              <span className="font-semibold text-text">24–48 Business Hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
