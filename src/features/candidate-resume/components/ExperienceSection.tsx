"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import type { CareerExperience } from "../types/resume.types";
import {
  formatExperienceRange,
  sortExperienceNewestFirst,
} from "../lib/resumeUtils";
import { SectionCard } from "./SectionCard";

export function ExperienceSection({
  experience,
  onAdd,
  onEdit,
  onDelete,
}: {
  experience: CareerExperience[];
  onAdd: () => void;
  onEdit: (item: CareerExperience) => void;
  onDelete: (item: CareerExperience) => void;
}) {
  const sorted = sortExperienceNewestFirst(experience);

  return (
    <SectionCard
      title="Work Experience"
      description="Share the roles that showcase your SAP and frontend career."
      action={
        <Button
          type="button"
          variant="secondary"
          className="!px-3 !py-2 text-xs"
          onClick={onAdd}
        >
          <Plus size={14} aria-hidden="true" />
          Add Experience
        </Button>
      }
    >
      {sorted.length ? (
        <ul className="space-y-3">
          {sorted.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-border bg-surface/40 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-text">{item.jobTitle}</p>
                  <p className="mt-1 text-sm text-primary">{item.company}</p>
                  <p className="text-sm text-muted">{item.location}</p>
                  <p className="mt-2 text-xs font-medium text-muted">
                    {formatExperienceRange(item)}
                  </p>
                  {item.description ? (
                    <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-muted">
                      {item.description}
                    </pre>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="!px-2.5 !py-1.5 text-xs"
                    onClick={() => onEdit(item)}
                  >
                    <Pencil size={13} aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="!px-2.5 !py-1.5 text-xs !text-error hover:!bg-error/10"
                    onClick={() => onDelete(item)}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No experience yet"
          description="Add your work experience to help employers understand your background."
          action={
            <Button type="button" variant="primary" onClick={onAdd}>
              <Plus size={15} aria-hidden="true" />
              Add Experience
            </Button>
          }
        />
      )}
    </SectionCard>
  );
}
