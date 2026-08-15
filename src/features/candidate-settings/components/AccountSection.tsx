"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, FileText, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import type { CandidateAccountInfo } from "../types/settings.types";
import { SettingsSection } from "./SettingsSection";

export function AccountSection({ account }: { account: CandidateAccountInfo }) {
  return (
    <SettingsSection
      id="account"
      title="Account"
      description="Manage your account identity, contact details, and linked credentials."
      badge={<StatusBadge tone="success">Active</StatusBadge>}
    >
      <div className="space-y-6">
        {/* Account Details */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border/80 bg-surface/40 p-4 transition-colors hover:border-border">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <Mail className="h-3.5 w-3.5 text-primary" />
              <span>Email Address</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-text truncate">
              {account.email}
            </p>
            <p className="mt-1 text-xs text-muted">
              Read-only. Primary email associated with your SAP Jobs account.
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-surface/40 p-4 transition-colors hover:border-border">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <Phone className="h-3.5 w-3.5 text-primary" />
              <span>Phone Number</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-text">
              {account.phone || "Not specified"}
            </p>
            <p className="mt-1 text-xs text-muted">
              Used for interview scheduling and recruiter communications.
            </p>
          </div>
        </div>

        {/* Account Status Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/80 bg-surface/30 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-text">Account Status</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </span>
              </div>
              <p className="text-xs text-muted">
                Your candidate profile is verified and active for application submissions.
              </p>
            </div>
          </div>
        </div>

        {/* Shortcuts: Profile & Resume */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Profile Shortcut */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserRound className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Profile Information</p>
                <p className="mt-0.5 text-xs text-muted">
                  Your professional summary, SAP certifications, and work experience are managed separately.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60">
              <Button href="/candidate/profile" variant="secondary" className="w-full justify-center text-xs py-2">
                <span>Edit Profile</span>
                <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Resume Shortcut */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Resume & CV</p>
                <p className="mt-0.5 text-xs text-muted">
                  Upload multiple resume versions, analyze your ATS score, and set your default application CV.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60">
              <Button href="/candidate/resume" variant="secondary" className="w-full justify-center text-xs py-2">
                <span>Manage Resume</span>
                <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
