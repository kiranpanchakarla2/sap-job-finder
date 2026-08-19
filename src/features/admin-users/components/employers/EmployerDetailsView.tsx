"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import type { AdminEmployerDetails } from "../../types/employer.types";
import { EmployerSuspendModal } from "./EmployerSuspendModal";
import { EmployerReactivateModal } from "./EmployerReactivateModal";
import { EmployerVerifyModal } from "./EmployerVerifyModal";
import {
  suspendEmployer,
  reactivateEmployer,
  setEmployerVerification,
} from "../../services/adminEmployerService";

type EmployerDetailsViewProps = {
  employer: AdminEmployerDetails;
  onRefresh: () => Promise<void>;
};

export function EmployerDetailsView({
  employer,
  onRefresh,
}: EmployerDetailsViewProps) {
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [targetVerification, setTargetVerification] = useState(true);
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

  const isSuspended = employer.accountStatus === "suspended";

  const handleSuspendConfirm = async () => {
    const res = await suspendEmployer(employer.id);
    if (res.success) {
      setToastMessage({ text: "Employer account suspended successfully.", type: "success" });
      await onRefresh();
    } else {
      setToastMessage({ text: res.error || "Failed to suspend employer.", type: "error" });
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleReactivateConfirm = async () => {
    const res = await reactivateEmployer(employer.id);
    if (res.success) {
      setToastMessage({ text: "Employer account reactivated successfully.", type: "success" });
      await onRefresh();
    } else {
      setToastMessage({ text: res.error || "Failed to reactivate employer.", type: "error" });
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleVerifyConfirm = async () => {
    const res = await setEmployerVerification(employer.id, targetVerification);
    if (res.success) {
      setToastMessage({
        text: targetVerification
          ? "Employer verified successfully."
          : "Employer verification removed.",
        type: "success",
      });
      await onRefresh();
    } else {
      setToastMessage({ text: res.error || "Failed to update verification.", type: "error" });
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openVerifyModal = (target: boolean) => {
    setTargetVerification(target);
    setVerifyModalOpen(true);
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
          <Link href="/admin/users/employers" className="hover:text-text transition">
            Employers
          </Link>
          <span>/</span>
          <span className="font-semibold text-text truncate max-w-[200px]">
            {employer.companyName}
          </span>
        </div>

        <Link
          href="/admin/users/employers"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-text hover:bg-surface transition shadow-xs"
        >
          <ArrowLeft size={13} />
          <span>Back to Employers</span>
        </Link>
      </div>

      {/* Main Company Header Card */}
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft space-y-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            {employer.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={employer.logoUrl}
                alt={employer.companyName}
                className="h-20 w-20 rounded-lg object-contain border-2 border-border bg-white p-1 shadow-sm"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 font-bold text-2xl border-2 border-indigo-500/20 shadow-sm">
                {getInitials(employer.companyName) || <Building2 size={32} />}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-text">{employer.companyName}</h1>

                {/* Status Badges */}
                {isSuspended ? (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Suspended
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active Company
                  </span>
                )}

                {employer.isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <BadgeCheck size={13} />
                    Verified Employer
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-surface text-muted border border-border">
                    Unverified
                  </span>
                )}
              </div>

              {employer.industry && (
                <p className="text-sm font-medium text-primary">
                  {employer.industry}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted pt-1">
                <div className="flex items-center gap-1">
                  <Mail size={13} className="text-muted" />
                  <span>{employer.workEmail}</span>
                </div>
                {employer.phone && employer.phone !== "—" && (
                  <div className="flex items-center gap-1">
                    <Phone size={13} className="text-muted" />
                    <span>{employer.phone}</span>
                  </div>
                )}
                {employer.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={13} className="text-muted" />
                    <span>{employer.location}</span>
                  </div>
                )}
                {employer.website && (
                  <a
                    href={employer.website.startsWith("http") ? employer.website : `https://${employer.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Globe size={13} />
                    <span>Website</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start">
            {/* Verify Button */}
            {employer.isVerified ? (
              <button
                type="button"
                onClick={() => openVerifyModal(false)}
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition"
              >
                <ShieldX size={14} />
                <span>Remove Verification</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openVerifyModal(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs"
              >
                <BadgeCheck size={14} />
                <span>Verify Employer</span>
              </button>
            )}

            {/* Suspend Button */}
            {isSuspended ? (
              <button
                type="button"
                onClick={() => setReactivateModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs"
              >
                <ShieldCheck size={14} />
                <span>Reactivate Company</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSuspendModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/20 dark:text-rose-400 transition"
              >
                <ShieldAlert size={14} />
                <span>Suspend Company</span>
              </button>
            )}
          </div>
        </div>

        {/* Timestamps & Quick Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-border pt-4 text-xs text-muted">
          <div>
            <span className="text-[11px] block">Company Setup</span>
            <span className="font-medium text-text">
              {employer.setupComplete ? "Completed" : "Pending Onboarding"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-muted" />
            <div>
              <span className="text-[11px] block">Registered On</span>
              <span className="font-medium text-text">{formatDate(employer.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-muted" />
            <div>
              <span className="text-[11px] block">Last Updated</span>
              <span className="font-medium text-text">{formatDate(employer.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 cols): Company Profile, Company Admin & Team Users */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information Card */}
          <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Building2 size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-text">Company Information</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div>
                <span className="text-[11px] text-muted block">Industry</span>
                <span className="font-medium text-text">{employer.industry || "—"}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted block">Company Size</span>
                <span className="font-medium text-text">{employer.companySize || "—"}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted block">Headquarters / City</span>
                <span className="font-medium text-text">{employer.city || employer.location || "—"}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted block">State / Country</span>
                <span className="font-medium text-text">
                  {[employer.state, employer.country].filter(Boolean).join(", ") || "—"}
                </span>
              </div>
              {employer.address && (
                <div className="sm:col-span-2">
                  <span className="text-[11px] text-muted block">Full Address</span>
                  <span className="font-medium text-text">{employer.address}</span>
                </div>
              )}
            </div>

            {employer.about && (
              <div className="border-t border-border pt-3">
                <span className="text-[11px] text-muted block mb-1">About Company</span>
                <p className="text-xs text-text leading-relaxed bg-surface/40 p-3 rounded-md border border-border">
                  {employer.about}
                </p>
              </div>
            )}
          </div>

          {/* Company Admin & Primary Contact */}
          <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <UserCheck size={16} className="text-emerald-500" />
              <h2 className="text-sm font-semibold text-text">Primary Company Admin</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div>
                <span className="text-[11px] text-muted block">Admin / Recruiter Name</span>
                <span className="font-semibold text-text">{employer.recruiterName}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted block">Designation</span>
                <span className="font-medium text-text">{employer.designation}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted block">Work Email</span>
                <span className="font-medium text-text">{employer.workEmail}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted block">Phone</span>
                <span className="font-medium text-text">{employer.phone}</span>
              </div>
            </div>
          </div>

          {/* Company Users / Team Members */}
          <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-indigo-500" />
                <h2 className="text-sm font-semibold text-text">
                  Company Users ({employer.companyUsers.length})
                </h2>
              </div>
              <span className="text-[11px] text-muted">
                Managed by Company Admin
              </span>
            </div>

            {employer.companyUsers.length === 0 ? (
              <p className="text-xs text-muted">No associated team users recorded.</p>
            ) : (
              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface/50 text-[10px] uppercase font-semibold text-muted">
                    <tr>
                      <th className="px-3 py-2.5">User</th>
                      <th className="px-3 py-2.5">Role</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {employer.companyUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-surface/30">
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-text">{user.name}</div>
                          <div className="text-[11px] text-muted">{user.email}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="capitalize font-medium text-text">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                              user.status === "active"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : user.status === "suspended"
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                  : "bg-surface text-muted border border-border"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-muted">
                          {formatDate(user.joinedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 col): Jobs Summary & Subscription Summary */}
        <div className="space-y-6">
          {/* Job Summary Card (READ-ONLY) */}
          <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-blue-500" />
                <h2 className="text-sm font-semibold text-text">Jobs Summary</h2>
              </div>
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-surface text-muted border border-border">
                <Lock size={10} />
                Read-Only
              </span>
            </div>

            {/* Metric Pills */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2.5 rounded bg-surface/50 border border-border">
                <span className="text-[11px] text-muted block">Total Jobs</span>
                <span className="font-bold text-base text-text">
                  {employer.jobSummary.totalJobs}
                </span>
              </div>
              <div className="p-2.5 rounded bg-emerald-500/5 border border-emerald-500/20">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">
                  Active
                </span>
                <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                  {employer.jobSummary.activeJobs}
                </span>
              </div>
              <div className="p-2.5 rounded bg-surface/50 border border-border">
                <span className="text-[11px] text-muted block">Draft</span>
                <span className="font-bold text-base text-text">
                  {employer.jobSummary.draftJobs}
                </span>
              </div>
              <div className="p-2.5 rounded bg-surface/50 border border-border">
                <span className="text-[11px] text-muted block">Closed / Expired</span>
                <span className="font-bold text-base text-text">
                  {employer.jobSummary.closedJobs + employer.jobSummary.expiredJobs}
                </span>
              </div>
            </div>

            {/* Recent Jobs Preview */}
            {employer.jobSummary.recentJobs.length > 0 && (
              <div className="border-t border-border pt-3 space-y-2">
                <span className="text-[11px] text-muted block font-medium">Recent Postings</span>
                <div className="space-y-1.5">
                  {employer.jobSummary.recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-2 rounded bg-surface/30 border border-border text-xs"
                    >
                      <div className="truncate max-w-[170px]">
                        <p className="font-medium text-text truncate">{job.title}</p>
                        <p className="text-[10px] text-muted">{job.sapModule} • {job.location}</p>
                      </div>
                      <span className="text-[10px] capitalize text-muted">
                        {job.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border pt-3 text-center">
              <Link
                href="/admin/jobs"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span>View Jobs in Admin →</span>
              </Link>
            </div>
          </div>

          {/* Employer Subscription Summary Card (READ-ONLY) */}
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

            {employer.subscription ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Current Plan:</span>
                  <span className="font-bold text-text">
                    {employer.subscription.planName}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted">Status:</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      employer.subscription.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-surface text-muted border border-border"
                    }`}
                  >
                    {employer.subscription.status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted">Period:</span>
                  <span className="font-medium text-text">
                    {formatDate(employer.subscription.currentPeriodStart)} – {formatDate(employer.subscription.currentPeriodEnd)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted">Days Remaining:</span>
                  <span className="font-bold text-primary">
                    {employer.subscription.daysRemaining} days
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted">Billing Cycle:</span>
                  <span className="font-medium capitalize text-text">
                    {employer.subscription.billingCycle}
                  </span>
                </div>

                {employer.subscription.renewalDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Renewal Date:</span>
                    <span className="font-medium text-text">
                      {formatDate(employer.subscription.renewalDate)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 text-center rounded bg-surface/40 border border-border text-xs space-y-1">
                <p className="font-semibold text-text">Employer Free Plan</p>
                <p className="text-[11px] text-muted">No active paid employer subscription.</p>
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
      <EmployerSuspendModal
        isOpen={suspendModalOpen}
        companyName={employer.companyName}
        onClose={() => setSuspendModalOpen(false)}
        onConfirm={handleSuspendConfirm}
      />

      <EmployerReactivateModal
        isOpen={reactivateModalOpen}
        companyName={employer.companyName}
        onClose={() => setReactivateModalOpen(false)}
        onConfirm={handleReactivateConfirm}
      />

      <EmployerVerifyModal
        isOpen={verifyModalOpen}
        companyName={employer.companyName}
        targetVerification={targetVerification}
        onClose={() => setVerifyModalOpen(false)}
        onConfirm={handleVerifyConfirm}
      />
    </div>
  );
}
