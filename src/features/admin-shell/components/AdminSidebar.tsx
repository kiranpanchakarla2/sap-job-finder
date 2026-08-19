"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Shield, X } from "lucide-react";
import { ADMIN_NAV_SECTIONS, type AdminNavItem } from "../constants";

type AdminSidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Close mobile drawer on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const renderNavList = (isMobile = false) => (
    <div className="flex h-full flex-col justify-between overflow-y-auto px-3 py-4">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2">
          <Link
            href="/admin"
            onClick={() => isMobile && onClose()}
            className="flex items-center gap-2.5 font-bold text-text group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-hover text-white shadow-soft">
              <Shield size={18} />
            </div>
            {(!collapsed || isMobile) && (
              <div className="flex flex-col">
                <span className="text-sm tracking-tight leading-tight">SAP Job Finder</span>
                <span className="text-[10px] font-semibold tracking-wider text-primary uppercase">
                  Super Admin
                </span>
              </div>
            )}
          </Link>

          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-surface hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Close admin navigation menu"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-5" aria-label="Super Admin navigation">
          {ADMIN_NAV_SECTIONS.map((section, idx) => (
            <div key={section.title || `section-${idx}`} className="space-y-1">
              {section.title && (!collapsed || isMobile) && (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted/70">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => isMobile && onClose()}
                      title={collapsed && !isMobile ? item.label : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold shadow-xs"
                          : "text-muted hover:bg-surface hover:text-text"
                      } ${collapsed && !isMobile ? "justify-center px-2" : ""}`}
                    >
                      <Icon
                        size={17}
                        className={`shrink-0 transition-colors ${
                          isActive ? "text-primary" : "text-muted group-hover:text-text"
                        }`}
                        aria-hidden="true"
                      />
                      {(!collapsed || isMobile) && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}
                      {(!collapsed || isMobile) && item.badge && (
                        <span className="rounded-full bg-surface border border-border px-1.5 py-0.2 text-[10px] font-semibold text-muted">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer Controls (Desktop Only) */}
      {!isMobile && (
        <div className="border-t border-border pt-3 mt-4">
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-muted hover:text-text transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight size={14} />
            ) : (
              <>
                <ChevronLeft size={14} />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:flex shrink-0 flex-col border-r border-border bg-card transition-all duration-200 ${
          collapsed ? "w-20" : "w-64"
        }`}
        aria-label="Super Admin sidebar"
      >
        <div className="sticky top-0 h-screen overflow-hidden">
          {renderNavList(false)}
        </div>
      </aside>

      {/* Mobile Drawer Backdrop & Slide-Over */}
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation drawer"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 left-0 flex max-w-full">
            <div className="relative w-72 max-w-[85vw] border-r border-border bg-card shadow-lift animate-in slide-in-from-left duration-200">
              {renderNavList(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
