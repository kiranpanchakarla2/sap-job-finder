"use client";

import { GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import type { CareerEducation } from "../types/resume.types";
import { formatMonthYear } from "../lib/resumeUtils";
import { SectionCard } from "./SectionCard";

export function EducationSection({
  education,
  onAdd,
  onEdit,
  onDelete,
}: {
  education: CareerEducation[];
  onAdd: () => void;
  onEdit: (item: CareerEducation) => void;
  onDelete: (item: CareerEducation) => void;
}) {
  return (
    <SectionCard
      title="Education"
      description="Add degrees and academic milestones that support your SAP career."
      action={
        <Button
          type="button"
          variant="secondary"
          className="!px-3 !py-2 text-xs"
          onClick={onAdd}
        >
          <Plus size={14} aria-hidden="true" />
          Add Education
        </Button>
      }
    >
      {education.length ? (
        <ul className="space-y-3">
          {education.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-border bg-surface/40 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-text">{item.degree}</p>
                  {item.fieldOfStudy ? (
                    <p className="mt-1 text-sm text-primary">
                      {item.fieldOfStudy}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-muted">{item.institution}</p>
                  {item.location ? (
                    <p className="text-sm text-muted">{item.location}</p>
                  ) : null}
                  <p className="mt-2 text-xs font-medium text-muted">
                    {formatMonthYear(item.startDate)} —{" "}
                    {formatMonthYear(item.endDate)}
                    {item.grade ? ` • ${item.grade}` : ""}
                  </p>
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
          title="No education added"
          description="Add your education details to complete your career profile."
          icon={GraduationCap}
          action={
            <Button type="button" variant="primary" onClick={onAdd}>
              <Plus size={15} aria-hidden="true" />
              Add Education
            </Button>
          }
        />
      )}
    </SectionCard>
  );
}
