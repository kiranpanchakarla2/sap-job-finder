"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, KeyRound, Loader2, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";
import { candidateSettingsService } from "../services/candidateSettingsService";

interface PasswordFormState {
  currentPassword: "";
  newPassword: "";
  confirmPassword: "";
}

interface PasswordFormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function ChangePasswordDialog({
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

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<PasswordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    // Reset state on open
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setErrors({});
    setIsSubmitting(false);

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

  const validate = (): boolean => {
    const nextErrors: PasswordFormErrors = {};

    if (!currentPassword) {
      nextErrors.currentPassword = "Current password is required";
    }

    if (!newPassword) {
      nextErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm password is required";
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const result = await candidateSettingsService.changePassword(
        currentPassword,
        newPassword,
      );

      if (!result.success) {
        if (result.error.toLowerCase().includes("current password")) {
          setErrors({ currentPassword: result.error });
        } else {
          toast.error(result.error);
        }
        return;
      }

      toast.success("Password updated successfully.");
      onClose();
    } catch {
      toast.error("Unable to update password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          {/* Backdrop */}
          <motion.button
            type="button"
            aria-label="Dismiss dialog"
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.96 }}
            className="relative z-10 w-full max-w-md rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-lift"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 id={titleId} className="text-lg font-bold text-text">
                    Change Password
                  </h2>
                  <p id={descriptionId} className="text-xs text-muted">
                    Update your account credentials to keep your profile secure.
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-text cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Current Password */}
              <div>
                <label
                  htmlFor="current-password-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
                >
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="current-password-input"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (errors.currentPassword) {
                        setErrors((prev) => ({ ...prev, currentPassword: undefined }));
                      }
                    }}
                    placeholder="Enter current password"
                    className={`w-full rounded-[var(--radius-control)] border bg-input px-3.5 py-2.5 pr-10 text-sm text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
                      errors.currentPassword ? "border-error" : "border-border"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    aria-label={showCurrent ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-text cursor-pointer"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.currentPassword ? (
                  <p className="mt-1 text-xs text-error">{errors.currentPassword}</p>
                ) : null}
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="new-password-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password-input"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) {
                        setErrors((prev) => ({ ...prev, newPassword: undefined }));
                      }
                    }}
                    placeholder="At least 8 characters"
                    className={`w-full rounded-[var(--radius-control)] border bg-input px-3.5 py-2.5 pr-10 text-sm text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
                      errors.newPassword ? "border-error" : "border-border"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    aria-label={showNew ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-text cursor-pointer"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.newPassword ? (
                  <p className="mt-1 text-xs text-error">{errors.newPassword}</p>
                ) : (
                  <p className="mt-1 text-[11px] text-muted">
                    Must be at least 8 characters long.
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirm-password-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password-input"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) {
                        setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                      }
                    }}
                    placeholder="Re-enter new password"
                    className={`w-full rounded-[var(--radius-control)] border bg-input px-3.5 py-2.5 pr-10 text-sm text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
                      errors.confirmPassword ? "border-error" : "border-border"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-text cursor-pointer"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword ? (
                  <p className="mt-1 text-xs text-error">{errors.confirmPassword}</p>
                ) : null}
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
