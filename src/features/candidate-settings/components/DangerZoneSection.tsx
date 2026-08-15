"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, LogOut, Trash2 } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { SettingsSection } from "./SettingsSection";

export function DangerZoneSection() {
  const { logout } = useAuth();
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const redirectPath = await logout();
      router.push(redirectPath || "/login/candidate");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <SettingsSection
        id="danger-zone"
        title="Danger Zone"
        description="Irreversible actions and session termination. Please proceed with caution."
        isDanger
      >
        <div className="space-y-4">
          {/* Sign Out Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/80 bg-surface/40 p-4 transition-colors hover:border-border">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted">
                <LogOut className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Sign Out of Account</p>
                <p className="mt-0.5 text-xs text-muted">
                  Safely end your current candidate session on this device.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="shrink-0 self-start sm:self-center px-4 py-2 text-xs"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              {isSigningOut ? "Signing Out..." : "Sign Out"}
            </Button>
          </div>

          {/* Delete Account Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-error/20 bg-error/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-error/10 text-error">
                <Trash2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-error">Delete Candidate Account</p>
                <p className="mt-0.5 text-xs text-muted">
                  Permanently delete your profile, resume records, application history, and preferences.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center justify-center rounded-[var(--radius-button)] border border-error/30 bg-error/10 px-4 py-2 text-xs font-semibold text-error shadow-soft hover:bg-error hover:text-white transition-all cursor-pointer shrink-0 self-start sm:self-center"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete Account
            </button>
          </div>
        </div>
      </SettingsSection>

      <DeleteAccountDialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
}
