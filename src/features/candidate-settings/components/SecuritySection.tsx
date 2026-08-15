"use client";

import { useState } from "react";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { SettingsSection } from "./SettingsSection";

export function SecuritySection() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  return (
    <>
      <SettingsSection
        id="security"
        title="Security"
        description="Manage your account authentication credentials and login protection."
      >
        <div className="space-y-4">
          {/* Password Item */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/80 bg-surface/40 p-4 transition-colors hover:border-border">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Account Password</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-sm tracking-widest text-muted">
                    ••••••••••••
                  </span>
                  <span className="text-[11px] text-muted">(Protected)</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Last updated recently. We recommend using a unique password with at least 8 characters.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPasswordModalOpen(true)}
              className="shrink-0 self-start sm:self-center px-3.5 py-1.5 text-xs"
            >
              <KeyRound className="mr-1.5 h-3.5 w-3.5" />
              Change Password
            </Button>
          </div>

          {/* Login Security Info */}
          <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-surface/20 p-4 text-xs text-muted">
            <ShieldCheck className="h-4 w-4 shrink-0 text-success mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <p className="font-semibold text-text">Session & Authentication Security</p>
              <p>
                Your session is protected via secure HTTP authorization tokens and SSL encryption. You can safely sign out of your account anytime using the Danger Zone section below.
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>

      <ChangePasswordDialog
        open={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
}
