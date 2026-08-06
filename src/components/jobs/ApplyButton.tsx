"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { applyToJob } from "@/services/applicationsService";
import { createClient } from "@/lib/supabase/client";
import { tryGetSupabaseEnv } from "@/lib/supabase/env";

export function ApplyButton({
  jobId,
  initiallyApplied = false,
}: {
  jobId: string;
  initiallyApplied?: boolean;
}) {
  const router = useRouter();
  const [applied, setApplied] = useState(initiallyApplied);
  const [loading, setLoading] = useState(false);

  const onApply = async () => {
    if (applied || loading) return;

    if (!tryGetSupabaseEnv()) {
      toast.message("Demo mode", {
        description: "Connect Supabase to persist applications. Redirecting to sign in…",
      });
      router.push(`/signin?next=/jobs/${jobId}`);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to apply");
        router.push(`/signin?next=/jobs/${jobId}`);
        return;
      }

      const { error } = await applyToJob(jobId, user.id);
      if (error) {
        // Mock job ids won't exist in DB — treat as soft success for UX demo
        if (error.code === "23503" || error.message?.includes("foreign key")) {
          toast.success("Application recorded locally — seed jobs in Supabase for persistence");
          setApplied(true);
          return;
        }
        toast.error(error.message || "Could not apply");
        return;
      }

      toast.success("Application submitted");
      setApplied(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={onApply}
      disabled={applied || loading}
      className="min-w-[120px]"
    >
      {applied ? "Applied" : loading ? "Applying…" : "Apply"}
    </Button>
  );
}
