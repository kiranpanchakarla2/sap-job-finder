"use client";

import { memo, useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  Eye,
  MoreVertical,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import type {
  AdminEmployerListItem,
  EmployerSortField,
  EmployerSortOrder,
} from "../../types/employer.types";

type EmployerListTableProps = {
  employers: AdminEmployerListItem[];
  isLoading: boolean;
  error: string | null;
  sortBy: EmployerSortField;
  sortOrder: EmployerSortOrder;
  onSort: (field: EmployerSortField) => void;
  onSuspend: (employer: AdminEmployerListItem) => void;
  onReactivate: (employer: AdminEmployerListItem) => void;
  onToggleVerify: (employer: AdminEmployerListItem, target: boolean) => void;
};

export const EmployerListTable = memo(function EmployerListTable({
  employers,
  isLoading,
  error,
  sortBy,
  sortOrder,
  onSort,
  onSuspend,
  onReactivate,
  onToggleVerify,
}: EmployerListTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{
    top?: number;
    bottom?: number;
    right: number;
    openUpward: boolean;
  } | null>(null);

  // Close menu on outside scroll / resize
  useEffect(() => {
    const handleDismiss = () => {
      setActiveMenuId(null);
      setMenuPos(null);
    };
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);
    return () => {
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
    };
  }, []);

  const handleToggleMenu = (
    id: string,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();
    if (activeMenuId === id) {
      setActiveMenuId(null);
      setMenuPos(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < 180;

    setMenuPos({
      top: openUpward ? undefined : rect.bottom + 4,
      bottom: openUpward ? window.innerHeight - rect.top + 4 : undefined,
      right: Math.max(16, window.innerWidth - rect.right),
      openUpward,
    });
    setActiveMenuId(id);
  };

  const activeEmployer = employers.find((e) => e.id === activeMenuId);

  const formatDate = (isoString: string) => {
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

  const renderSortIndicator = (field: EmployerSortField) => {
    if (sortBy !== field) return null;
    return <span className="ml-1 text-primary">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-6 w-1/4 rounded bg-surface/80" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-12 w-full rounded bg-surface/50" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-xs text-rose-500">
            <p className="font-semibold text-sm">Unable to load employers.</p>
            <p className="mt-1 text-muted">{error}</p>
          </div>
        ) : employers.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 size={32} className="mx-auto text-muted/60 mb-3" />
            <p className="text-sm font-semibold text-text">No employers found</p>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              No employers match your current search or filter criteria. Try adjusting or resetting filters.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-surface/50 text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-border">
              <tr>
                <th
                  scope="col"
                  className="px-5 py-3.5 cursor-pointer hover:text-text select-none"
                  onClick={() => onSort("company_name")}
                >
                  <div className="flex items-center">
                    <span>Company</span>
                    {renderSortIndicator("company_name")}
                  </div>
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Admin Email
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Location
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Subscription
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Account Status
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Verification
                </th>
                <th
                  scope="col"
                  className="px-4 py-3.5 cursor-pointer hover:text-text select-none"
                  onClick={() => onSort("active_jobs")}
                >
                  <div className="flex items-center">
                    <span>Active Jobs</span>
                    {renderSortIndicator("active_jobs")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3.5 cursor-pointer hover:text-text select-none"
                  onClick={() => onSort("created_at")}
                >
                  <div className="flex items-center">
                    <span>Registered</span>
                    {renderSortIndicator("created_at")}
                  </div>
                </th>
                <th scope="col" className="px-5 py-3.5 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {employers.map((emp) => {
                const isSuspended = emp.accountStatus === "suspended";

                return (
                  <tr
                    key={emp.id}
                    className="transition hover:bg-surface/40 group"
                  >
                    {/* Company Name & Logo */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {emp.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={emp.logoUrl}
                            alt={emp.companyName}
                            className="h-8 w-8 rounded-md object-contain border border-border bg-white p-0.5"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 font-semibold text-xs border border-indigo-500/20">
                            {getInitials(emp.companyName) || <Building2 size={14} />}
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/admin/users/employers/${emp.id}`}
                            className="font-medium text-text hover:text-primary transition"
                          >
                            {emp.companyName}
                          </Link>
                          {emp.industry && (
                            <p className="text-[11px] text-muted truncate max-w-[160px]">
                              {emp.industry}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Admin Email */}
                    <td className="px-4 py-3.5 text-muted">
                      <div className="space-y-0.5">
                        <span className="text-text font-medium block">
                          {emp.adminName}
                        </span>
                        <span className="text-[11px] text-muted truncate max-w-[150px] block">
                          {emp.adminEmail}
                        </span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3.5 text-muted">
                      <span className="truncate max-w-[140px] inline-block">
                        {emp.location || "—"}
                      </span>
                    </td>

                    {/* Subscription */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <span className="font-medium text-text block">
                          {emp.subscriptionPlan}
                        </span>
                        <span
                          className={`inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider ${
                            emp.subscriptionStatus === "active"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-surface text-muted border border-border"
                          }`}
                        >
                          {emp.subscriptionStatus}
                        </span>
                      </div>
                    </td>

                    {/* Account Status */}
                    <td className="px-4 py-3.5">
                      {isSuspended ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      )}
                    </td>

                    {/* Verification */}
                    <td className="px-4 py-3.5">
                      {emp.isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <BadgeCheck size={11} />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-surface text-muted border border-border">
                          Unverified
                        </span>
                      )}
                    </td>

                    {/* Active Jobs */}
                    <td className="px-4 py-3.5 text-text">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-text">
                          {emp.activeJobsCount}
                        </span>
                        <span className="text-[10px] text-muted">
                          / {emp.totalJobsCount} total
                        </span>
                      </div>
                    </td>

                    {/* Registered Date */}
                    <td className="px-4 py-3.5 text-muted whitespace-nowrap">
                      {formatDate(emp.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <Link
                          href={`/admin/users/employers/${emp.id}`}
                          className="rounded p-1.5 text-muted hover:text-primary hover:bg-surface transition"
                          title="View Company Details"
                        >
                          <Eye size={15} />
                        </Link>

                        <button
                          type="button"
                          onClick={(e) => handleToggleMenu(emp.id, e)}
                          className="rounded p-1.5 text-muted hover:text-text hover:bg-surface transition"
                          aria-label="Employer actions"
                        >
                          <MoreVertical size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Unclipped Fixed Dropdown Action Menu */}
      {activeMenuId && menuPos && activeEmployer && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setActiveMenuId(null);
              setMenuPos(null);
            }}
          />
          <div
            className="fixed z-50 w-48 rounded-md border border-border bg-card p-1 shadow-xl text-left animate-in fade-in zoom-in-95 duration-150"
            style={{
              top: menuPos.top !== undefined ? `${menuPos.top}px` : undefined,
              bottom: menuPos.bottom !== undefined ? `${menuPos.bottom}px` : undefined,
              right: `${menuPos.right}px`,
            }}
          >
            <Link
              href={`/admin/users/employers/${activeEmployer.id}`}
              onClick={() => {
                setActiveMenuId(null);
                setMenuPos(null);
              }}
              className="flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-text hover:bg-surface transition"
            >
              <Eye size={13} className="text-muted" />
              <span>View Company</span>
            </Link>

            {/* Verify Toggle */}
            {activeEmployer.isVerified ? (
              <button
                type="button"
                onClick={() => {
                  const emp = activeEmployer;
                  setActiveMenuId(null);
                  setMenuPos(null);
                  onToggleVerify(emp, false);
                }}
                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-amber-600 hover:bg-amber-500/10 transition"
              >
                <ShieldX size={13} />
                <span>Remove Verification</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const emp = activeEmployer;
                  setActiveMenuId(null);
                  setMenuPos(null);
                  onToggleVerify(emp, true);
                }}
                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-500/10 transition"
              >
                <BadgeCheck size={13} />
                <span>Verify Employer</span>
              </button>
            )}

            {/* Suspend Toggle */}
            {activeEmployer.accountStatus === "suspended" ? (
              <button
                type="button"
                onClick={() => {
                  const emp = activeEmployer;
                  setActiveMenuId(null);
                  setMenuPos(null);
                  onReactivate(emp);
                }}
                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-emerald-600 hover:bg-emerald-500/10 transition"
              >
                <ShieldCheck size={13} />
                <span>Reactivate Account</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const emp = activeEmployer;
                  setActiveMenuId(null);
                  setMenuPos(null);
                  onSuspend(emp);
                }}
                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-500/10 transition"
              >
                <ShieldAlert size={13} />
                <span>Suspend Account</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
});
