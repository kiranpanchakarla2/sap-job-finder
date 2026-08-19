"use client";

import { memo, useEffect, useState } from "react";
import Link from "next/link";
import {
  Eye,
  MoreVertical,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import type {
  AdminCandidateListItem,
  CandidateSortField,
  CandidateSortOrder,
} from "../../types/candidate.types";

type CandidateListTableProps = {
  candidates: AdminCandidateListItem[];
  isLoading: boolean;
  error: string | null;
  sortBy: CandidateSortField;
  sortOrder: CandidateSortOrder;
  onSort: (field: CandidateSortField) => void;
  onSuspend: (candidate: AdminCandidateListItem) => void;
  onReactivate: (candidate: AdminCandidateListItem) => void;
};

export const CandidateListTable = memo(function CandidateListTable({
  candidates,
  isLoading,
  error,
  sortBy,
  sortOrder,
  onSort,
  onSuspend,
  onReactivate,
}: CandidateListTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{
    top?: number;
    bottom?: number;
    right: number;
    openUpward: boolean;
  } | null>(null);

  // Close menu on outside click / scroll / resize
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
    const openUpward = spaceBelow < 150;

    setMenuPos({
      top: openUpward ? undefined : rect.bottom + 4,
      bottom: openUpward ? window.innerHeight - rect.top + 4 : undefined,
      right: Math.max(16, window.innerWidth - rect.right),
      openUpward,
    });
    setActiveMenuId(id);
  };

  const activeCandidate = candidates.find((c) => c.id === activeMenuId);

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

  const renderSortIndicator = (field: CandidateSortField) => {
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
            <p className="font-semibold text-sm">Unable to load candidates.</p>
            <p className="mt-1 text-muted">{error}</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={32} className="mx-auto text-muted/60 mb-3" />
            <p className="text-sm font-semibold text-text">No candidates found</p>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              No candidates match your current search or filter criteria. Try adjusting or resetting filters.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-surface/50 text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-border">
              <tr>
                <th
                  scope="col"
                  className="px-5 py-3.5 cursor-pointer hover:text-text select-none"
                  onClick={() => onSort("full_name")}
                >
                  <div className="flex items-center">
                    <span>Candidate</span>
                    {renderSortIndicator("full_name")}
                  </div>
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Email
                </th>
                <th scope="col" className="px-4 py-3.5">
                  SAP Modules
                </th>
                <th
                  scope="col"
                  className="px-4 py-3.5 cursor-pointer hover:text-text select-none"
                  onClick={() => onSort("total_experience")}
                >
                  <div className="flex items-center">
                    <span>Experience</span>
                    {renderSortIndicator("total_experience")}
                  </div>
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Discoverability
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Subscription
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Status
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
              {candidates.map((cand) => {
                const isSuspended = cand.accountStatus === "suspended";
                const isDiscoverable =
                  cand.discoveryStatus === "open_to_opportunities" ||
                  cand.discoveryStatus === "available" ||
                  cand.isSearchable;

                return (
                  <tr
                    key={cand.id}
                    className="transition hover:bg-surface/40 group"
                  >
                    {/* Candidate Name & Avatar */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {cand.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cand.avatarUrl}
                            alt={cand.fullName}
                            className="h-8 w-8 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
                            {getInitials(cand.fullName) || <UserRound size={14} />}
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/admin/users/candidates/${cand.id}`}
                            className="font-medium text-text hover:text-primary transition"
                          >
                            {cand.fullName}
                          </Link>
                          {cand.headline && (
                            <p className="text-[11px] text-muted truncate max-w-[180px]">
                              {cand.headline}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3.5 text-muted">
                      <span className="truncate max-w-[160px] inline-block">
                        {cand.email}
                      </span>
                    </td>

                    {/* SAP Modules */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {cand.sapModules.length > 0 ? (
                          cand.sapModules.slice(0, 2).map((mod) => (
                            <span
                              key={mod}
                              className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-surface text-text border border-border"
                            >
                              {mod}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-muted">—</span>
                        )}
                        {cand.sapModules.length > 2 && (
                          <span className="text-[10px] text-muted font-medium">
                            +{cand.sapModules.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Experience */}
                    <td className="px-4 py-3.5 text-text">
                      {cand.totalExperience > 0
                        ? `${cand.totalExperience} yr${cand.totalExperience === 1 ? "" : "s"}`
                        : "Entry Level"}
                    </td>

                    {/* Discoverability */}
                    <td className="px-4 py-3.5">
                      {isDiscoverable ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Discoverable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-surface text-muted border border-border">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted" />
                          Off
                        </span>
                      )}
                    </td>

                    {/* Subscription */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <span className="font-medium text-text block">
                          {cand.subscriptionPlan}
                        </span>
                        <span
                          className={`inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider ${
                            cand.subscriptionStatus === "active"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-surface text-muted border border-border"
                          }`}
                        >
                          {cand.subscriptionStatus}
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

                    {/* Registered Date */}
                    <td className="px-4 py-3.5 text-muted whitespace-nowrap">
                      {formatDate(cand.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <Link
                          href={`/admin/users/candidates/${cand.id}`}
                          className="rounded p-1.5 text-muted hover:text-primary hover:bg-surface transition"
                          title="View Candidate Details"
                        >
                          <Eye size={15} />
                        </Link>

                        <button
                          type="button"
                          onClick={(e) => handleToggleMenu(cand.id, e)}
                          className="rounded p-1.5 text-muted hover:text-text hover:bg-surface transition"
                          aria-label="Candidate actions"
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
      {activeMenuId && menuPos && activeCandidate && (
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
              href={`/admin/users/candidates/${activeCandidate.id}`}
              onClick={() => {
                setActiveMenuId(null);
                setMenuPos(null);
              }}
              className="flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-text hover:bg-surface transition"
            >
              <Eye size={13} className="text-muted" />
              <span>View Profile</span>
            </Link>

            {activeCandidate.accountStatus === "suspended" ? (
              <button
                type="button"
                onClick={() => {
                  const c = activeCandidate;
                  setActiveMenuId(null);
                  setMenuPos(null);
                  onReactivate(c);
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
                  const c = activeCandidate;
                  setActiveMenuId(null);
                  setMenuPos(null);
                  onSuspend(c);
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
