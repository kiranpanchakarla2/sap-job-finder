"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";
import { EMPLOYER_ROUTES } from "@/features/employer-company/constants";
import { useEmployerAuth } from "@/features/employer-auth";
import { EMPLOYER_LOGOUT_LANDING_PATH } from "@/features/employer-auth/config/employerSession";

function SettingsSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft"
    >
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DeleteAccountDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (!open) return;
    setConfirmText("");
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = panel ? getFocusableElements(panel) : [];
    window.requestAnimationFrame(() => {
      (focusables[0] ?? panel)?.focus({ preventScroll: true });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (panel) trapFocus(event, panel);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  const confirmed = confirmText.trim().toUpperCase() === "DELETE";

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <motion.button
            type="button"
            aria-label="Dismiss dialog"
            className="absolute inset-0 bg-black/40"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
            className="relative z-10 w-full max-w-md rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-lift sm:p-6"
          >
            <h2 id={titleId} className="text-lg font-semibold text-text">
              Delete Employer Account
            </h2>
            <p id={descriptionId} className="mt-2 text-sm text-muted">
              This action requires confirmation and will not permanently delete
              data in Sprint 6A. Account deletion will be connected in a future
              release.
            </p>
            <label htmlFor="delete-confirm" className="mt-4 block text-sm text-text">
              Type <span className="font-semibold">DELETE</span> to confirm
            </label>
            <input
              id="delete-confirm"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              className="mt-2 w-full rounded-[var(--radius-control)] border border-border bg-input px-3 py-2.5 text-sm text-input-fg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            />
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!confirmed}
                onClick={() => {
                  toast.message("Account deletion requires additional confirmation.", {
                    description:
                      "Please confirm your request before your account can be permanently deleted.",
                  });
                  onClose();
                }}
              >
                Confirm Delete Request
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export function SettingsPage() {
  const { employer, isLoading, signOut } = useEmployerAuth();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-56" />
      </div>
    );
  }

  if (!employer) {
    return (
      <div className="mx-auto max-w-4xl">
        <ErrorState title="Unable to load settings." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage your employer account, notifications, and security preferences.
        </p>
      </div>

      <SettingsSection
        id="account"
        title="Account"
        description="Your signed-in employer identity."
      >
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Name
            </dt>
            <dd className="mt-1 text-sm font-medium text-text">
              {[employer.firstName, employer.lastName].filter(Boolean).join(" ") ||
                "—"}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Email
            </dt>
            <dd className="mt-1 text-sm font-medium text-text">{employer.email}</dd>
          </div>
        </dl>
      </SettingsSection>

      <SettingsSection
        id="company"
        title="Company"
        description="Update your public company profile and recruiter details."
      >
        <Button href={EMPLOYER_ROUTES.company} variant="secondary">
          Manage Company Profile
        </Button>
      </SettingsSection>

      <SettingsSection
        id="security"
        title="Security"
        description="Password and session controls for your employer account."
      >
        <div className="space-y-3">
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-text">Change Password</p>
              <p className="mt-0.5 text-sm text-muted">
                Use the password reset flow to update your credentials.
              </p>
            </div>
            <Button href={EMPLOYER_ROUTES.forgotPassword} variant="secondary">
              Reset Password
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-surface/40 px-4 py-4">
            <p className="text-sm font-medium text-text">Active Sessions</p>
            <p className="mt-0.5 text-sm text-muted">
              Session management details will expand when backend support is added.
              You can sign out of this device below.
            </p>
            <div className="mt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  toast.message("Signed out of other sessions is coming soon.");
                }}
              >
                Sign Out All Sessions
              </Button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                void (async () => {
                  await signOut();
                  router.replace(EMPLOYER_LOGOUT_LANDING_PATH);
                })();
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        id="danger-zone"
        title="Danger Zone"
        description="Irreversible account actions. Confirmation is required."
      >
        <div className="rounded-xl border border-error/30 bg-error/5 px-4 py-4">
          <p className="text-sm font-medium text-text">Delete Employer Account</p>
          <p className="mt-1 text-sm text-muted">
            Request deletion of your employer account.
          </p>
          <div className="mt-3">
            <Button type="button" variant="secondary" onClick={() => setDeleteOpen(true)}>
              Delete Employer Account
            </Button>
          </div>
        </div>
      </SettingsSection>

      <p className="text-center text-xs text-muted">
        Looking for billing? Visit{" "}
        <Link href="/employer/subscription" className="text-primary hover:underline">
          Subscription
        </Link>
        .
      </p>

      <DeleteAccountDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </div>
  );
}
