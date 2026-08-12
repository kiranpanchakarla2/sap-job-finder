"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import type { CandidateCertification } from "@/features/candidate-profile/types/profile.types";
import { SectionCard } from "./SectionCard";

function formatYear(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return String(date.getFullYear());
}

/**
 * Displays Sprint 1 certifications (read-only). Manage via Profile page.
 */
export function ResumeCertificationsSection({
  certifications,
}: {
  certifications: CandidateCertification[];
}) {
  return (
    <SectionCard
      title="SAP Certifications"
      description="Certifications from your candidate profile."
      action={
        <Button
          href="/candidate/profile"
          variant="secondary"
          className="!px-3 !py-2 text-xs"
        >
          Manage Certifications
        </Button>
      }
    >
      {certifications.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {certifications.map((cert) => (
            <li
              key={cert.id}
              className="rounded-2xl border border-border bg-surface/40 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-text">{cert.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {cert.issuingOrganization}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    Issued: {formatYear(cert.issueDate)}
                  </p>
                </div>
                <StatusBadge
                  tone={cert.status === "Active" ? "success" : "muted"}
                >
                  {cert.status === "Active" ? "Valid" : cert.status}
                </StatusBadge>
              </div>
              <div className="mt-3">
                <Link
                  href="/candidate/profile"
                  className="text-xs font-semibold text-primary hover:text-accent"
                >
                  View / Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No certifications yet"
          description="Add SAP certifications from your profile."
          icon={BadgeCheck}
          action={
            <Button href="/candidate/profile" variant="primary">
              Manage Certifications
            </Button>
          }
        />
      )}
    </SectionCard>
  );
}
