"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  Heart,
  LayoutDashboard,
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
};

export type SidebarNavSection = {
  title?: string;
  items: SidebarNavItem[];
};

export function DashboardSidebar({
  sections,
  homeHref,
  open,
  onClose,
  ariaLabel,
}: {
  sections: SidebarNavSection[];
  homeHref: string;
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const onLogout = async () => {
    const redirect = await logout();
    onClose();
    router.push(redirect);
  };

  const nav = (
    <div className="flex h-full flex-col px-4 py-5">
      <div className="mb-6 flex items-center justify-between gap-2 px-2">
        <BrandLogo href={homeHref} onClick={onClose} />
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted lg:hidden"
          aria-label="Close navigation menu"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto" aria-label={ariaLabel}>
        {sections.map((section) => (
          <div key={section.title ?? section.items[0]?.label}>
            {section.title ? (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                {section.title}
              </p>
            ) : null}
            <div className="flex flex-col gap-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== homeHref && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`inline-flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted hover:bg-surface hover:text-text"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon size={18} aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        className="mt-4 inline-flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
      >
        <LogOut size={18} aria-hidden="true" />
        Logout
      </button>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
        <div className="sticky top-0 h-screen">{nav}</div>
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
            {nav}
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
      { label: "My Profile", href: "/candidate/profile", icon: UserRound },
      { label: "Resume", href: "/candidate/resume", icon: FileText },
      { label: "Applied Jobs", href: "/candidate/applied-jobs", icon: Briefcase },
      { label: "Saved Jobs", href: "/candidate/saved-jobs", icon: Heart },
      { label: "Job Alerts", href: "/candidate/job-alerts", icon: Bell },
    ],
  },
  {
    title: "Career Services",
    items: [
      { label: "Mock Interview", href: "/candidate/mock-interview", icon: Target },
      { label: "Career Counselling", href: "/candidate/career-counselling", icon: Users },
    ],
  },
  {
    title: "Learning",
    items: [{ label: "Learning Center", href: "/candidate/learning", icon: BookOpen }],
  },
  {
    title: "Community",
    items: [{ label: "Community", href: "/candidate/community", icon: UsersRound }],
  },
  {
    items: [
      { label: "Messages", href: "/candidate/messages", icon: MessageSquare },
      { label: "Notifications", href: "/candidate/notifications", icon: Bell },
      { label: "Settings", href: "/candidate/settings", icon: Settings },
    ],
  },
];

export const employerNavSections: SidebarNavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/employer/dashboard", icon: LayoutDashboard },
      { label: "Post Job", href: "/employer/post-job", icon: PlusCircle },
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
      { label: "Company Profile", href: "/employer/company-profile", icon: Building2 },
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
