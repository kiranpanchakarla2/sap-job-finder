"use client";

import { useState } from "react";
import {
  BookOpen,
  Briefcase,
  Clock,
  FileText,
  HelpCircle,
  History,
  LifeBuoy,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { CandidateContactForm } from "./CandidateContactForm";
import { CandidateRequestHistory } from "./CandidateRequestHistory";
import type { ContactRequestCategory } from "@/types/contact";

export interface CandidateContactViewProps {
  initialCategory?: ContactRequestCategory;
  initialSubject?: string;
  initialMessage?: string;
  jobId?: string;
  jobTitle?: string;
  applicationId?: string;
}

export function CandidateContactView({
  initialCategory,
  initialSubject,
  initialMessage,
  jobId,
  jobTitle,
  applicationId,
}: CandidateContactViewProps) {
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* Candidate Page Header */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-surface to-card p-6 sm:p-8 lg:p-10 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <LifeBuoy size={14} aria-hidden="true" />
              <span>Candidate Support & Help</span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-text sm:text-3xl lg:text-4xl">
              How can we help?
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
              We&apos;re here to help with your SAP Jobs Finder experience. Have a question about your
              profile, an application, a job, your account, or anything else? Send us a message.
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
            <CandidateContactForm
              initialCategory={initialCategory}
              initialSubject={initialSubject}
              initialMessage={initialMessage}
              contextJobId={jobId}
              contextJobTitle={jobTitle}
              contextApplicationId={applicationId}
              onViewRequests={() => setActiveTab("history")}
            />
          ) : (
            <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft sm:p-8">
              <CandidateRequestHistory onNewRequest={() => setActiveTab("form")} />
            </div>
          )}
        </div>

        {/* Sidebar Info & Common Topics (Right: 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick FAQ / Guidance Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-text">
              <HelpCircle size={16} className="text-primary" aria-hidden="true" />
              <span>Common Support Topics</span>
            </h3>

            <div className="mt-4 space-y-3.5 text-xs text-muted">
              <div className="flex items-start gap-2.5">
                <FileText size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-text">Profile & Resume</p>
                  <p className="mt-0.5">Need help highlighting your SAP certifications or updating your resume parse score?</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Briefcase size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-text">Job Applications</p>
                  <p className="mt-0.5">Check status updates or report discrepancies with employer job postings.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-text">Account & Security</p>
                  <p className="mt-0.5">Assistance with login, 2FA, password resets, or account visibility settings.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Response Time SLA Card */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-soft text-xs text-text">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Clock size={16} aria-hidden="true" />
              <span>Dedicated Candidate Support</span>
            </div>

            <p className="mt-2 text-muted leading-relaxed">
              Our support team reviews candidate requests Monday through Friday. You will receive an
              update directly at your registered candidate account email address.
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
