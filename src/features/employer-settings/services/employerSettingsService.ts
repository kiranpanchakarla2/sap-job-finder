import { createClient } from "@/lib/supabase/client";

export type EmployerSettingsResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

function logError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production" && error !== null && error !== undefined) {
    console.error(`[employerSettingsService] ${context}`, error);
  }
}

export const employerSettingsService = {
  /**
   * Delete employer account permanently.
   * Performs clean removal of employer account, associated company data (if owner),
   * job postings, applications, recruiter memberships, and auth user.
   */
  async deleteAccount(): Promise<EmployerSettingsResult<boolean>> {
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          success: false,
          error: "You must be signed in to delete your account.",
          code: "UNAUTHENTICATED",
        };
      }

      // 1. Call secure PostgreSQL RPC to delete employer account & company data
      const { error: rpcError } = await supabase.rpc("delete_employer_account");

      if (rpcError) {
        logError("deleteAccount RPC error", rpcError);
        return {
          success: false,
          error: rpcError.message || "Failed to delete account. Please try again or contact support.",
        };
      }

      // 2. Clear local auth session & employer client state
      try {
        const { endEmployerSession } = await import(
          "@/features/employer-auth/lib/endEmployerSession"
        );
        await endEmployerSession({ reason: "explicit" });
      } catch {
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch {
          // Ignore if session is already invalidated
        }
      }

      return {
        success: true,
        data: true,
      };
    } catch (err) {
      logError("deleteAccount unexpected error", err);
      return {
        success: false,
        error: "An unexpected error occurred while deleting your account.",
      };
    }
  },
};
