"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { AdminCandidateDetails } from "../../types/candidate.types";
import { CandidateSuspendModal } from "./CandidateSuspendModal";
import { CandidateReactivateModal } from "./CandidateReactivateModal";
import { suspendCandidate, reactivateCandidate } from "../../services/adminCandidateService";

type CandidateDetailsViewProps = {
  candidate: AdminCandidateDetails;
  onRefresh: () => Promise<void>;
};

export function CandidateDetailsView({
  candidate,
  onRefresh,
}: CandidateDetailsViewProps) {
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const formatDate = (isoString: string | null | undefined) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const isSuspended = candidate.accountStatus === "suspended";
  const isDiscoverable =
    candidate.discoveryStatus === "open_to_opportunities" ||
    candidate.discoveryStatus === "available" ||
    candidate.isSearchable;

  const handleSuspendConfirm = async () => {
    const res = await suspendCandidate(candidate.id);
    if (res.success) {
      setToastMessage({ text: "Candidate account suspended successfully.", type: "success" });
      await onRefresh();
    } else {
      setToastMessage({ text: res.error || "Failed to suspend candidate.", type: "error" });
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleReactivateConfirm = async () => {
    const res = await reactivateCandidate(candidate.id);
    if (res.success) {
      setToastMessage({ text: "Candidate account reactivated successfully.", type: "success" });
      await onRefresh();
    } else {
      setToastMessage({ text: res.error || "Failed to reactivate candidate.", type: "error" });
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed top-5 right-5 z-50 rounded-md p-3.5 text-xs font-medium shadow-lg border animate-in slide-in-from-top duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
          }`}
        >
          {toastMessage.text}
        </div>
      )}

      {/* Top Breadcrumbs & Back Nav */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Link href="/admin" className="hover:text-text transition">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/admin/users/candidates" className="hover:text-text transition">
            Candidates
          </Link>
          <span>/</span>
          <span className="font-semibold text-text truncate max-w-[200px]">
            {candidate.fullName}
          </span>
        </div>

        <Link
          href="/admin/users/candidates"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-text hover:bg-surface transition shadow-xs"
        >
          <ArrowLeft size={13} />
          <span>Back to Candidates</span>
        </Link>
      </div>

      {/* Main Profile Header Card */}
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft space-y-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            {candidate.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={candidate.avatarUrl}
                alt={candidate.fullName}
                className="h-20 w-20 rounded-full object-cover border-2 border-primary/20 shadow-sm"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-2xl border-2 border-primary/20 shadow-sm">
                {getInitials(candidate.fullName) || <UserRound size={32} />}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-text">{candidate.fullName}</h1>

                {/* Status Badges */}
                {isSuspended ? (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Suspended
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active Account
                  </span>
                )}

                {isDiscoverable ? (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Discoverability: ON
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-surface text-muted border border-border">
                    Discoverability: OFF
                  </span>
                )}
              </div>

              {candidate.headline && (
                <p className="text-sm font-medium text-primary">
                  {candidate.headline}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted pt-1">
                <div className="flex items-center gap-1">
                  <Mail size={13} className="text-muted" />
                  <span>{candidate.email}</span>
                </div>
                {candidate.phone && (
                  <div className="flex items-center gap-1">
                    <Phone size={13} className="text-muted" />
                    <span>{candidate.phone}</span>
                  </div>
                )}
                {candidate.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={13} className="text-muted" />
                    <span>{candidate.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="flex items-center gap-2.5 self-start">
            {isSuspended ? (
              <button
                type="button"
                onClick={() => setReactivateModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs"
              >
                <ShieldCheck size={14} />
                <span>Reactivate Account</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSuspendModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/20 dark:text-rose-400 transition"
              >
                <ShieldAlert size={14} />
                <span>Suspend Account</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Completion & Timestamps */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-border pt-4 text-xs text-muted">
          <div>
            <div className="flex justify-between font-medium text-text mb-1">
              <span>Profile Completion</span>
              <span>{candidate.profileCompletion}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${candidate.profileCompletion}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-muted" />
            <div>
              <span className="text-[11px] block">Registered On</span>
              <span className="font-medium text-text">{formatDate(candidate.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-muted" />
            <div>
              <span className="text-[11px] block">Last Updated</span>
              <span className="font-medium text-text">{formatDate(candidate.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Professional & Skills Info (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Professional Information Card */}
          <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Briefcase size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-text">Professional Information</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div>
                <span className="text-[11px] text-muted block">Current Role / Title</span>
                <span className="font-medium text-text">
                  {candidate.currentJobRole || "—"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted block">Current Company</span>
                <span className="font-medium text-text">
                  {candidate.currentCompany || "—"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted block">Total Experience</span>
                <span className="font-medium text-text">
                  {candidate.totalExperience > 0
                    ? `${candidate.totalExperience} Years`
                    : candidate.experienceBand || "Entry Level"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted block">Employment Status</span>
                <span className="font-medium text-text">
                  {candidate.employmentStatus || "—"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted block">Notice Period</span>
                <span className="font-medium text-text">
                  {candidate.noticePeriod || "—"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted block">Expected CTC</span>
                <span className="font-medium text-text">
                  {candidate.expectedCtc
                    ? `₹${candidate.expectedCtc.toLocaleString("en-IN")}`
                    : candidate.preferredSalaryRange || "—"}
                </span>
              </div>
            </div>

            {candidate.aboutMe && (
              <div className="border-t border-border pt-3">
                <span className="text-[11px] text-muted block mb-1">Professional Summary</span>
                <p className="text-xs text-text leading-relaxed bg-surface/40 p-3 rounded-md border border-border">
                  {candidate.aboutMe}
                </p>
              </div>
            )}

            {/* Social / Portfolio Links */}
            {(candidate.linkedinUrl || candidate.githubUrl || candidate.portfolioUrl) && (
              <div className="flex flex-wrap gap-3 border-t border-border pt-3 text-xs">
                {candidate.linkedinUrl && (
                  <a
                    href={candidate.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Globe size={12} />
                    <span>LinkedIn Profile</span>
                    <ExternalLink size={10} />
                  </a>
                )}
                {candidate.githubUrl && (
                  <a
                    href={candidate.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Globe size={12} />
                    <span>GitHub Profile</span>
                    <ExternalLink size={10} />
                  </a>
                )}
                {candidate.portfolioUrl && (
                  <a
                    href={candidate.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Globe size={12} />
                    <span>Portfolio Website</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* SAP & Technical Skills Card */}
          <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Sparkles size={16} className="text-amber-500" />
              <h2 className="text-sm font-semibold text-text">SAP & Technical Skills</h2>
            </div>

            {/* SAP Modules */}
            <div>
              <span className="text-[11px] text-muted block mb-1.5">SAP Modules</span>
              <div className="flex flex-wrap gap-1.5">
                {candidate.preferredSapModules.length > 0 || candidate.sapSkills.length > 0 ? (
                  Array.from(
                    new Set([...candidate.preferredSapModules, ...candidate.sapSkills]),
                  ).map((mod) => (
                    <span
                      key={mod}
                      className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                    >
                      {mod}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted">No specific SAP modules specified</span>
                )}
              </div>
            </div>

            {/* Module Experience Table */}
            {candidate.moduleExperience.length > 0 && (
              <div className="border-t border-border pt-3">
                <span className="text-[11px] text-muted block mb-2 font-medium">
                  Module Experience Breakdown
                </span>
                <div className="overflow-hidden rounded-md border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface/50 text-[10px] uppercase font-semibold text-muted">
                      <tr>
                        <th className="px-3 py-2">Module</th>
                        <th className="px-3 py-2">Experience</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {candidate.moduleExperience.map((me, idx) => (
                        <tr key={idx} className="hover:bg-surface/30">
                          <td className="px-3 py-2 font-medium text-text">{me.module}</td>
                          <td className="px-3 py-2 text-muted">{me.years} Years</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Technical Skills List */}
            {candidate.skillsList.length > 0 && (
              <div className="border-t border-border pt-3">
                <span className="text-[11px] text-muted block mb-1.5 font-medium">
                  Skills & Proficiency
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skillsList.map((sk, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs bg-surface text-text border border-border"
                    >
                      <span>{sk.name}</span>
                      {sk.proficiency && (
                        <span className="text-[10px] text-muted capitalize">
                          ({sk.proficiency})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {candidate.certifications.length > 0 && (
              <div className="border-t border-border pt-3 space-y-2">
                <span className="text-[11px] text-muted block font-medium">Certifications</span>
                <div className="space-y-2">
                  {candidate.certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-start justify-between gap-3 p-2.5 rounded-md bg-surface/40 border border-border text-xs"
                    >
                      <div className="flex items-start gap-2">
                        <Award size={15} className="text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-text">{cert.name}</p>
                          <p className="text-[11px] text-muted">
                            {cert.issuingOrganization} • Issued {formatDate(cert.issueDate)}
                          </p>
                          {cert.credentialId && (
                            <p className="text-[10px] text-muted font-mono mt-0.5">
                              ID: {cert.credentialId}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {cert.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Work Experience & Education */}
          <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <BookOpen size={16} className="text-indigo-500" />
              <h2 className="text-sm font-semibold text-text">Career & Education History</h2>
            </div>

            {/* Work History */}
            <div className="space-y-3">
              <span className="text-[11px] text-muted block font-medium">Work History</span>
              {candidate.workExperience.length > 0 ? (
                <div className="space-y-3">
                  {candidate.workExperience.map((exp) => (
                    <div
                      key={exp.id}
                      className="border-l-2 border-primary/30 pl-3 py-0.5 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-text">{exp.designation}</p>
                        <span className="text-[11px] text-muted">
                          {formatDate(exp.startDate)} – {exp.isCurrent ? "Present" : formatDate(exp.endDate)}
                        </span>
                      </div>
                      <p className="text-xs text-primary font-medium">{exp.companyName}</p>
                      {exp.description && (
                        <p className="text-[11px] text-muted leading-relaxed">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted">No structured work history entries recorded.</p>
              )}
            </div>

            {/* Education History */}
            <div className="border-t border-border pt-3 space-y-3">
              <span className="text-[11px] text-muted block font-medium">Education</span>
              {candidate.education.length > 0 ? (
                <div className="space-y-2">
                  {candidate.education.map((edu) => (
                    <div
                      key={edu.id}
                      className="p-2.5 rounded-md bg-surface/40 border border-border text-xs flex justify-between items-start"
                    >
                      <div>
                        <p className="font-semibold text-text">{edu.degree}</p>
                        <p className="text-[11px] text-muted">
                          {edu.institution} {edu.fieldOfStudy ? `• ${edu.fieldOfStudy}` : ""}
                        </p>
                      </div>
                      <span className="text-[11px] text-muted">
                        {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted">No education records provided.</p>
              )}
            </div>

            {/* Resume File */}
            {candidate.resumeUrl && (
              <div className="border-t border-border pt-3 flex items-center justify-between gap-3 p-3 rounded-md bg-primary/5 border border-primary/20 text-xs">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  <div>
                    <p className="font-semibold text-text">
                      {candidate.resumeFileName || "Candidate Resume"}
                    </p>
                    <p className="text-[11px] text-muted">Uploaded candidate CV document</p>
                  </div>
                </div>
                <a
                  href={candidate.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-xs font-semibold text-white hover:bg-primary/90 transition shadow-xs"
                >
                  <Download size={12} />
                  <span>Download</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Discoverability & Subscription (1 col) */}
        <div className="space-y-6">
          {/* Discoverability & Privacy Settings Card (READ-ONLY) */}
          <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-blue-500" />
                <h2 className="text-sm font-semibold text-text">Discoverability & Privacy</h2>
              </div>
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-surface text-muted border border-border">
                <Lock size={10} />
                Read-Only
              </span>
            </div>

            <div className="rounded-md bg-blue-500/5 border border-blue-500/20 p-2.5 text-[11px] text-blue-600 dark:text-blue-400">
              <p className="font-semibold">Privacy Notice:</p>
              <p className="mt-0.5">
                Admin viewing does not alter candidate discoverability or employer visibility preferences.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-surface/50 border border-border">
                <span className="text-muted">Discovery Status:</span>
                <span
                  className={`font-semibold capitalize ${
                    isDiscoverable ? "text-emerald-600 dark:text-emerald-400" : "text-muted"
                  }`}
                >
                  {candidate.discoveryStatus.replace(/_/g, " ")}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-surface/50 border border-border">
                <span className="text-muted">Profile Visibility:</span>
                <span className="font-semibold capitalize text-text">
                  {candidate.privacyPreferences.profileVisibility}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-surface/50 border border-border">
                <span className="text-muted">Talent Search Opt-in:</span>
                <span className="font-semibold text-text">
                  {candidate.privacyPreferences.showInTalentSearch ? "Enabled" : "Disabled"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-surface/50 border border-border">
                <span className="text-muted">Show Resume to Recruiters:</span>
                <span className="font-semibold text-text">
                  {candidate.privacyPreferences.showResumeToRecruiters ? "Allowed" : "Restricted"}
                </span>
              </div>
            </div>
          </div>

          {/* Candidate Subscription Summary Card (READ-ONLY) */}
          <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-purple-500" />
                <h2 className="text-sm font-semibold text-text">Subscription Summary</h2>
              </div>
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-surface text-muted border border-border">
                <Lock size={10} />
                Read-Only
              </span>
            </div>

            {candidate.subscription ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Current Plan:</span>
                  <span className="font-bold text-text">
                    {candidate.subscription.planName}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted">Status:</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      candidate.subscription.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-surface text-muted border border-border"
                    }`}
                  >
                    {candidate.subscription.status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted">Period:</span>
                  <span className="font-medium text-text">
                    {formatDate(candidate.subscription.currentPeriodStart)} – {formatDate(candidate.subscription.currentPeriodEnd)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted">Days Remaining:</span>
                  <span className="font-bold text-primary">
                    {candidate.subscription.daysRemaining} days
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted">Billing Cycle:</span>
                  <span className="font-medium capitalize text-text">
                    {candidate.subscription.billingCycle}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 text-center rounded bg-surface/40 border border-border text-xs space-y-1">
                <p className="font-semibold text-text">Candidate Free Plan</p>
                <p className="text-[11px] text-muted">No active paid subscription attached.</p>
              </div>
            )}

            <div className="border-t border-border pt-3 text-center">
              <Link
                href="/admin/subscriptions"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span>View Subscription Plans & History →</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <CandidateSuspendModal
        isOpen={suspendModalOpen}
        candidateName={candidate.fullName}
        onClose={() => setSuspendModalOpen(false)}
        onConfirm={handleSuspendConfirm}
      />

      <CandidateReactivateModal
        isOpen={reactivateModalOpen}
        candidateName={candidate.fullName}
        onClose={() => setReactivateModalOpen(false)}
        onConfirm={handleReactivateConfirm}
      />
    </div>
  );
}
