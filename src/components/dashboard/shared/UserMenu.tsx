"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Building2, ChevronDown, HelpCircle, LogOut, Settings, UserRound } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { useRouter } from "next/navigation";
import { resolveEmployerMembership } from "@/features/employer-auth/services/employerMembershipService";
import { endEmployerSession } from "@/features/employer-auth/lib/endEmployerSession";
import {
  isEmployerCompanyRole,
  type EmployerCompanyRole,
} from "@/lib/auth/employerPermissions";
import { createClient } from "@/lib/supabase/client";
import type { AuthRole } from "@/types/auth";

function platformRoleLabel(role: AuthRole) {
  switch (role) {
    case "employer":
      return "Employer";
    case "admin":
      return "Admin";
    default:
      return "Candidate";
  }
}

function companyRoleLabel(role: EmployerCompanyRole) {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "recruiter":
      return "Recruiter";
    case "hiring_manager":
      return "Hiring Manager";
    default:
      return role;
  }
}

export function UserMenu() {
  const { user, logout, refreshSession } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyRole, setCompanyRole] = useState<EmployerCompanyRole | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!user || (user.role !== "employer" && user.role !== "admin")) {
      setCompanyName(null);
      setCompanyRole(null);
      return;
    }

    let cancelled = false;
    (async () => {
      const membership = await resolveEmployerMembership();
      if (cancelled) return;
      if (membership.status !== "active" && membership.status !== "suspended") {
        setCompanyName(user.companyName ?? null);
        setCompanyRole(null);
        return;
      }

      setCompanyRole(
        isEmployerCompanyRole(membership.membership.role)
          ? membership.membership.role
          : null,
      );

      const supabase = createClient();
      const { data } = await supabase
        .from("company_profiles")
        .select("company_name")
        .eq("id", membership.membership.companyId)
        .maybeSingle();

      if (cancelled) return;
      setCompanyName(data?.company_name?.trim() || user.companyName || null);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  const isEmployer = user.role === "employer" || user.role === "admin";
  const profileHref = isEmployer ? "/employer/profile" : "/candidate/profile";
  const companyHref = "/employer/company";
  const settingsHref = isEmployer ? "/employer/settings" : "/candidate/settings";
  const profileLabel = "My Profile";

  const personName = user.name || user.email;
  const headerPrimary = isEmployer
    ? companyName || user.companyName || "Your company"
    : personName;
  const headerSecondary = isEmployer
    ? `${personName}${companyRole ? ` · ${companyRoleLabel(companyRole)}` : ""}`
    : platformRoleLabel(user.role);

  const initials =
    user.avatarInitials ||
    personName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const onLogout = async () => {
    setOpen(false);
    if (isEmployer) {
      const redirect = await endEmployerSession({ reason: "explicit" });
      await refreshSession();
      router.push(redirect);
      return;
    }
    const redirect = await logout();
    router.push(redirect);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2.5 py-1.5 transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="User menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-[160px] truncate text-xs font-semibold text-text">
            {headerPrimary}
          </span>
          <span className="block max-w-[180px] truncate text-[11px] text-muted">
            {headerSecondary}
          </span>
        </span>
        <ChevronDown size={14} className="hidden text-muted sm:block" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-card py-1 shadow-lift"
        >
          <Link
            href={profileHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-text transition hover:bg-surface"
          >
            <UserRound size={15} aria-hidden="true" />
            {profileLabel}
          </Link>
          {isEmployer ? (
            <Link
              href={companyHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-text transition hover:bg-surface"
            >
              <Building2 size={15} aria-hidden="true" />
              Company Profile
            </Link>
          ) : null}
          <Link
            href={settingsHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-text transition hover:bg-surface"
          >
            <Settings size={15} aria-hidden="true" />
            Settings
          </Link>
          {isEmployer ? (
            <Link
              href="/employer/contact"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-text transition hover:bg-surface"
            >
              <HelpCircle size={15} aria-hidden="true" />
              Help & Support
            </Link>
          ) : (
            <Link
              href="/candidate/contact"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-text transition hover:bg-surface"
            >
              <HelpCircle size={15} aria-hidden="true" />
              Help & Support
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => void onLogout()}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-error transition hover:bg-error/10"
          >
            <LogOut size={15} aria-hidden="true" />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
