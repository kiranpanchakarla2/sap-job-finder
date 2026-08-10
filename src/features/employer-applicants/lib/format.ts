import { APPLICATION_STATUS_LABELS } from "../constants";
import type { ApplicationStatus } from "../types/application.types";

export function formatApplicationDate(
  value: string | null | undefined,
  style: "short" | "long" = "short",
): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  if (style === "long") {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatExperienceYears(years: number): string {
  return `${years} year${years === 1 ? "" : "s"}`;
}

export function getStatusLabel(status: ApplicationStatus): string {
  return APPLICATION_STATUS_LABELS[status];
}

export function getCandidateInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatJobContext(parts: {
  location: string;
  workArrangement: string;
}): string {
  return `${parts.location} · ${parts.workArrangement}`;
}
