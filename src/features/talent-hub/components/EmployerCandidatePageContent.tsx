"use client";

import { useEffect, useState } from "react";
import { CandidateUnavailableView } from "./CandidateUnavailableView";
import { EmployerCandidateProfileView } from "./EmployerCandidateProfileView";
import { EmployerSignInGate } from "./EmployerSignInGate";
import { employerTalentProfileService } from "../services/employerTalentProfileService";
import type {
  EmployerCandidateProfile,
  EmployerCandidateServiceResult,
} from "../types/employerCandidate.types";

type EmployerCandidatePageContentProps = {
  candidateId: string;
};

export function EmployerCandidatePageContent({
  candidateId,
}: EmployerCandidatePageContentProps) {
  const [result, setResult] = useState<EmployerCandidateServiceResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const res = await employerTalentProfileService.getPermittedCandidateProfile(candidateId);
      if (active) {
        setResult(res);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [candidateId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 animate-pulse">
        <div className="h-5 w-48 rounded bg-card/60" />
        <div className="h-44 rounded-2xl bg-card/60 border border-border" />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-32 rounded-2xl bg-card/60" />
            <div className="h-64 rounded-2xl bg-card/60" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="h-48 rounded-2xl bg-card/60" />
            <div className="h-40 rounded-2xl bg-card/60" />
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return <CandidateUnavailableView />;
  }

  if (!result.success) {
    if (result.code === "UNAUTHENTICATED" || result.code === "UNAUTHORIZED") {
      return <EmployerSignInGate candidateId={candidateId} />;
    }

    if (result.code === "PRIVATE_PROFILE") {
      return (
        <CandidateUnavailableView
          title="Candidate Profile is Private"
          message="This candidate has set their profile visibility to private and is not discoverable by employers."
        />
      );
    }

    return (
      <CandidateUnavailableView
        title="Candidate Profile Unavailable"
        message={result.error || "This candidate profile is no longer available."}
      />
    );
  }

  return <EmployerCandidateProfileView candidate={result.data} />;
}
