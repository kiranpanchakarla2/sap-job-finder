"use client";

import Link from "next/link";
import { ArrowLeft, Briefcase, ExternalLink, MapPin } from "lucide-react";
import { ApplicationStatusBadge } from "@/features/candidate-applications/components/ApplicationStatusBadge";
import type { ApplicationStatus } from "@/features/candidate-applications/types/application.types";
import type { CandidateConversation } from "../types/message.types";
import { CompanyAvatar } from "./CompanyAvatar";

export function ConversationHeader({
  conversation,
  onBack,
}: {
  conversation: CandidateConversation;
  onBack?: () => void;
}) {
  return (
    <header className="flex flex-col gap-2.5 sm:gap-3 border-b border-border bg-card/80 p-3 sm:p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border border-border bg-surface text-muted transition hover:text-text lg:hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            aria-label="Back to conversations"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
        ) : null}

        <CompanyAvatar
          name={conversation.companyName}
          logo={conversation.companyLogo}
          logoColor={conversation.companyLogoColor}
          logoUrl={conversation.companyLogoUrl}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h2 className="truncate text-sm sm:text-base font-bold text-text">
              {conversation.companyName}
            </h2>
            {conversation.applicationStatus ? (
              <ApplicationStatusBadge
                status={conversation.applicationStatus as ApplicationStatus}
              />
            ) : null}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
            <span className="truncate max-w-[140px] sm:max-w-none font-medium text-text/80">
              {conversation.jobTitle}
            </span>
            {conversation.jobLocation ? (
              <span className="inline-flex shrink-0 items-center gap-1">
                <MapPin size={11} className="text-muted" aria-hidden="true" />
                <span className="truncate max-w-[100px] sm:max-w-none">{conversation.jobLocation}</span>
              </span>
            ) : null}
            {conversation.jobWorkMode ? (
              <span className="shrink-0 rounded bg-surface px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-muted">
                {conversation.jobWorkMode}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Action links */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 self-start sm:self-center shrink-0">
        {conversation.jobId ? (
          <Link
            href={`/candidate/jobs/${conversation.jobId}`}
            className="inline-flex items-center gap-1 rounded-lg sm:rounded-xl border border-border bg-surface/80 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold text-text shadow-soft transition hover:border-primary/30 hover:bg-surface focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            <ExternalLink size={12} aria-hidden="true" />
            <span>View Job</span>
          </Link>
        ) : null}

        {conversation.applicationId ? (
          <Link
            href={`/candidate/applications/${conversation.applicationId}`}
            className="inline-flex items-center gap-1 rounded-lg sm:rounded-xl border border-border bg-surface/80 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold text-text shadow-soft transition hover:border-primary/30 hover:bg-surface focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            <Briefcase size={12} aria-hidden="true" />
            <span>View Application</span>
          </Link>
        ) : null}
      </div>
    </header>
  );
}
