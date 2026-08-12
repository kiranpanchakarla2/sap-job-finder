"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import type { CandidateCertification } from "../types/profile.types";
import { SectionCard } from "./SectionCard";

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CertificationSection({
  certifications,
  editing,
  onAdd,
  onEdit,
  onRemove,
}: {
  certifications: CandidateCertification[];
  editing: boolean;
  onAdd: () => void;
  onEdit: (cert: CandidateCertification) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <SectionCard
      title="Certifications"
      description="Showcase your SAP and professional certifications."
      action={
        editing ? (
          <Button
            type="button"
            variant="secondary"
            className="!px-3 !py-2 text-xs"
            onClick={onAdd}
          >
            <Plus size={14} aria-hidden="true" />
            Add Certification
          </Button>
        ) : null
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
                </div>
                <StatusBadge
                  tone={cert.status === "Active" ? "success" : "muted"}
                >
                  {cert.status}
                </StatusBadge>
              </div>
              <dl className="mt-3 space-y-1 text-xs text-muted">
                <div className="flex justify-between gap-3">
                  <dt>ID</dt>
                  <dd className="font-medium text-text">
                    {cert.certificationId || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Issued</dt>
                  <dd className="font-medium text-text">
                    {formatDate(cert.issueDate)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Expires</dt>
                  <dd className="font-medium text-text">
                    {formatDate(cert.expiryDate)}
                  </dd>
                </div>
              </dl>
              {editing ? (
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="!px-2.5 !py-1.5 text-xs"
                    onClick={() => onEdit(cert)}
                  >
                    <Pencil size={13} aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="!px-2.5 !py-1.5 text-xs !text-error hover:!bg-error/10"
                    onClick={() => onRemove(cert.id)}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                    Remove
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-border bg-surface/30 px-4 py-8 text-center text-sm text-muted">
          No certifications yet.
          {editing ? " Add your first SAP certification." : ""}
        </p>
      )}
    </SectionCard>
  );
}
