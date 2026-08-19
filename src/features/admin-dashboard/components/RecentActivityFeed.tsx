"use client";

/**
 * RecentActivityFeed Component
 * Real platform event stream showing candidate registrations, employer onboarding,
 * payment requests, subscription activations, jobs posted, and contact requests.
 */

import {
  Activity,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Inbox,
  MessageSquare,
  UserPlus,
  Zap,
} from "lucide-react";
import type { ActivityItem, ActivityItemType } from "../types/dashboard.types";

type RecentActivityFeedProps = {
  activities: ActivityItem[];
  loading?: boolean;
  error?: string | null;
};

function formatRelativeTime(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHour / 24);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoDate;
  }
}

function getActivityIcon(type: ActivityItemType) {
  switch (type) {
    case "candidate_registered":
      return {
        icon: UserPlus,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
      };
    case "employer_registered":
      return {
        icon: Building2,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10",
      };
    case "payment_requested":
      return {
        icon: Inbox,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
      };
    case "payment_received":
      return {
        icon: CheckCircle2,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
      };
    case "subscription_activated":
      return {
        icon: Zap,
        color: "text-teal-500",
        bg: "bg-teal-500/10",
      };
    case "job_posted":
      return {
        icon: Briefcase,
        color: "text-violet-500",
        bg: "bg-violet-500/10",
      };
    case "contact_enquiry":
      return {
        icon: MessageSquare,
        color: "text-rose-500",
        bg: "bg-rose-500/10",
      };
    default:
      return {
        icon: Activity,
        color: "text-muted",
        bg: "bg-surface",
      };
  }
}

export function RecentActivityFeed({
  activities,
  loading = false,
  error = null,
}: RecentActivityFeedProps) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card shadow-soft overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between p-5 border-b border-border bg-surface/30">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-primary" />
          <h3 className="text-base font-semibold text-text">Recent Activity</h3>
        </div>
        <span className="text-[11px] text-muted font-medium">Live Feed</span>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-surface/60 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/4 rounded bg-surface/60" />
                  <div className="h-3 w-1/2 rounded bg-surface/40" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center text-xs text-rose-500">
            Unable to load recent activity feed.
          </div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center">
            <Activity size={24} className="mx-auto text-muted/60 mb-2" />
            <p className="text-sm font-medium text-text">No recent activity.</p>
            <p className="text-xs text-muted mt-0.5">
              Platform events will appear here as users interact.
            </p>
          </div>
        ) : (
          <div className="relative pl-3 space-y-4 before:absolute before:left-6 before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
            {activities.map((act) => {
              const { icon: Icon, color, bg } = getActivityIcon(act.type);
              return (
                <div
                  key={act.id}
                  className="relative flex items-start gap-3 group"
                >
                  <div
                    className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${bg} ${color} border border-border/50`}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-text truncate">
                        {act.title}
                      </span>
                      <span className="text-[10px] text-muted shrink-0 flex items-center gap-1">
                        <Clock size={10} />
                        {formatRelativeTime(act.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5 break-words">
                      {act.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
