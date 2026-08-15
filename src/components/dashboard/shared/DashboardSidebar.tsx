"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Heart,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageSquare,
  PlusCircle,
  Search,
  Settings,
  Target,
  Users,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useAuth } from "@/auth/AuthContext";

export type SidebarNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Optional unread / count badge (e.g. Messages). */
  badgeCount?: number;
  /** Optional text badge (e.g. "Soon", "New"). */
  badgeText?: string;
  /** Subtle plan-restriction indicator (navigation remains accessible). */
  locked?: boolean;
};

export type SidebarNavSection = {
  title?: string;
  items: SidebarNavItem[];
};

const EMPLOYER_SIDEBAR_COLLAPSED_KEY = "sapjobsfinder-employer-sidebar-collapsed";

function SidebarTooltip({
  label,
  enabled,
  children,
}: {
  label: string;
  enabled: boolean;
  children: ReactNode;
}) {
  if (!enabled) return <>{children}</>;

  return (
    <span className="group/tooltip relative flex w-full justify-center">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-text opacity-0 shadow-lift transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

function SidebarNav({
  sections,
  homeHref,
  ariaLabel,
  collapsed,
  onNavigate,
  onLogout,
  showCloseButton,
  onClose,
}: {
  sections: SidebarNavSection[];
  homeHref: string;
  ariaLabel: string;
  collapsed: boolean;
  onNavigate: () => void;
  onLogout: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const allHrefs = sections.flatMap((entry) => entry.items.map((item) => item.href));
  const activeHref =
    allHrefs
      .filter(
        (href) =>
          href === pathname ||
          (href !== homeHref &&
            (pathname === href || pathname.startsWith(`${href}/`))),
      )
      .sort((a, b) => b.length - a.length)[0] ?? null;

  return (
    <div
      className={`flex h-full flex-col py-5 ${collapsed ? "px-2" : "px-4"}`}
    >
      <div
        className={`mb-6 flex items-center gap-2 ${
          collapsed ? "justify-center px-0" : "justify-between px-2"
        }`}
      >
        <BrandLogo href={homeHref} onClick={onNavigate} markOnly={collapsed} />
        {showCloseButton ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted lg:hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            aria-label="Close navigation menu"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      <nav
        className="flex flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden"
        aria-label={ariaLabel}
      >
        {sections.map((section) => (
          <div key={section.title ?? section.items[0]?.label}>
            {section.title && !collapsed ? (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                {section.title}
              </p>
            ) : null}
            <div className={`flex flex-col gap-1 ${collapsed ? "items-center" : ""}`}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = activeHref === item.href;
                const badge = item.badgeCount && item.badgeCount > 0
                  ? item.badgeCount > 9
                    ? "9+"
                    : String(item.badgeCount)
                  : null;
                const ariaLabel = collapsed
                  ? badge
                    ? `${item.label}, ${item.badgeCount} unread`
                    : item.label
                  : undefined;

                return (
                  <SidebarTooltip
                    key={item.href}
                    label={
                      badge ? `${item.label} (${badge})` : item.label
                    }
                    enabled={collapsed}
                  >
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      aria-label={ariaLabel}
                      className={`relative inline-flex items-center rounded-[var(--radius-control)] text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
                        collapsed
                          ? "h-10 w-10 justify-center"
                          : "w-full gap-3 px-3 py-2.5"
                      } ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted hover:bg-surface hover:text-text"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="relative shrink-0">
                        <Icon size={18} aria-hidden="true" />
                        {collapsed && badge ? (
                          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
                            {badge}
                          </span>
                        ) : null}
                      </span>
                      {!collapsed ? (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.locked ? (
                            <Lock
                              size={14}
                              className="shrink-0 text-muted"
                              aria-hidden="true"
                            />
                          ) : null}
                          {item.badgeText ? (
                            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              {item.badgeText}
                            </span>
                          ) : null}
                          {badge ? (
                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
                              {badge}
                            </span>
                          ) : null}
                        </>
                      ) : null}
                    </Link>
                  </SidebarTooltip>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={`mt-4 ${collapsed ? "flex justify-center" : ""}`}>
      <SidebarTooltip label="Logout" enabled={collapsed}>
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? "Logout" : undefined}
          aria-label="Logout"
          className={`inline-flex items-center rounded-[var(--radius-control)] text-sm font-medium text-error transition duration-200 hover:bg-error/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-error/20 ${
            collapsed
              ? "h-10 w-10 justify-center"
              : "w-full gap-3 px-3 py-2.5"
          }`}
        >
          <LogOut size={18} className="shrink-0" aria-hidden="true" />
          {!collapsed ? <span>Logout</span> : null}
        </button>
      </SidebarTooltip>
      </div>
    </div>
  );
}

export function DashboardSidebar({
  sections,
  homeHref,
  open,
  onClose,
  ariaLabel,
  collapsible = false,
}: {
  sections: SidebarNavSection[];
  homeHref: string;
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  /** Desktop expand/collapse — employer only. Mobile drawer always stays expanded. */
  collapsible?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [preferenceReady, setPreferenceReady] = useState(false);

  useEffect(() => {
    if (!collapsible) return;
    try {
      const stored = window.localStorage.getItem(EMPLOYER_SIDEBAR_COLLAPSED_KEY);
      setCollapsed(stored === "true");
    } catch {
      setCollapsed(false);
    }
    setPreferenceReady(true);
  }, [collapsible]);

  useEffect(() => {
    if (!collapsible || !preferenceReady) return;
    try {
      window.localStorage.setItem(
        EMPLOYER_SIDEBAR_COLLAPSED_KEY,
        collapsed ? "true" : "false",
      );
    } catch {
      // Ignore storage write failures (private mode, quota, etc.)
    }
  }, [collapsed, collapsible, preferenceReady]);

  const onLogout = async () => {
    onClose();
    if (pathname.startsWith("/employer")) {
      const { endEmployerSession } = await import(
        "@/features/employer-auth/lib/endEmployerSession"
      );
      const redirect = await endEmployerSession({ reason: "explicit" });
      router.push(redirect);
      return;
    }
    const redirect = await logout();
    router.push(redirect);
  };

  const toggleCollapsed = () => setCollapsed((value) => !value);
  const collapseLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <>
      <aside
        className={`relative sticky top-0 z-30 hidden h-screen shrink-0 self-start overflow-visible border-r border-border bg-card transition-[width] duration-200 ease-out lg:block ${
          collapsible && collapsed ? "w-20" : "w-64"
        }`}
      >
        {collapsible ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapseLabel}
            title={collapseLabel}
            aria-expanded={!collapsed}
            className="absolute top-7 -right-3 z-40 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted shadow-soft transition hover:border-primary/30 hover:text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            {collapsed ? (
              <ChevronRight size={14} aria-hidden="true" />
            ) : (
              <ChevronLeft size={14} aria-hidden="true" />
            )}
          </button>
        ) : null}

        <div className="h-full overflow-hidden">
          <SidebarNav
            sections={sections}
            homeHref={homeHref}
            ariaLabel={ariaLabel}
            collapsed={Boolean(collapsible && collapsed)}
            onNavigate={onClose}
            onLogout={onLogout}
          />
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu overlay"
            onClick={onClose}
          />
          <aside className="absolute inset-y-0 left-0 w-[min(20rem,88vw)] border-r border-border bg-card shadow-lift">
            <SidebarNav
              sections={sections}
              homeHref={homeHref}
              ariaLabel={ariaLabel}
              collapsed={false}
              onNavigate={onClose}
              onLogout={onLogout}
              showCloseButton
              onClose={onClose}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}

export const candidateNavSections: SidebarNavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/candidate/dashboard", icon: LayoutDashboard },
      { label: "Find Jobs", href: "/candidate/jobs", icon: Search },
      { label: "My Profile", href: "/candidate/profile", icon: UserRound },
      { label: "Resume", href: "/candidate/resume", icon: FileText },
      { label: "Applications", href: "/candidate/applications", icon: Briefcase },
      { label: "Saved Jobs", href: "/candidate/saved-jobs", icon: Heart },
      { label: "Job Alerts", href: "/candidate/job-alerts", icon: Bell },
    ],
  },
  {
    items: [
      { label: "Messages", href: "/candidate/messages", icon: MessageSquare },
      { label: "Notifications", href: "/candidate/notifications", icon: Bell },
      { label: "Subscriptions", href: "/candidate/subscription", icon: CreditCard },
      { label: "Settings", href: "/candidate/settings", icon: Settings },
    ],
  },
  {
    title: "Career Services",
    items: [
      { label: "Mock Interview", href: "/candidate/mock-interview", icon: Target, badgeText: "Soon" },
      { label: "Career Counselling", href: "/candidate/career-counselling", icon: Users, badgeText: "Soon" },
    ],
  },
  {
    title: "Learning",
    items: [{ label: "Learning Center", href: "/candidate/learning", icon: BookOpen, badgeText: "Soon" }],
  },
  {
    title: "Community",
    items: [{ label: "Community", href: "/candidate/community", icon: UsersRound, badgeText: "Soon" }],
  },
];

export const employerNavSections: SidebarNavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/employer/dashboard", icon: LayoutDashboard },
      { label: "Post Job", href: "/employer/jobs/new", icon: PlusCircle },
      { label: "Manage Jobs", href: "/employer/jobs", icon: Briefcase },
      { label: "Applicants", href: "/employer/applicants", icon: Users },
      { label: "Shortlisted", href: "/employer/shortlisted", icon: Heart },
      { label: "Interviews", href: "/employer/interviews", icon: CalendarDays },
      { label: "Talent Search", href: "/employer/talent-search", icon: Search },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "Company Profile", href: "/employer/company", icon: Building2 },
      { label: "Team & Users", href: "/employer/team", icon: UsersRound },
    ],
  },
  {
    title: "Communication",
    items: [{ label: "Messages", href: "/employer/messages", icon: MessageSquare }],
  },
  {
    items: [
      { label: "Analytics", href: "/employer/analytics", icon: BarChart3 },
      { label: "Subscription", href: "/employer/subscription", icon: CreditCard },
      { label: "Settings", href: "/employer/settings", icon: Settings },
    ],
  },
];
