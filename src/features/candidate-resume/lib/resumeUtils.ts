import type {
  CareerExperience,
  ResumeFileType,
} from "../types/resume.types";

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const HIGHLIGHT_MAX_CHARS = 250;

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract", label: "Contract" },
  { value: "Internship", label: "Internship" },
] as const;

const EXT_TO_TYPE: Record<string, ResumeFileType> = {
  pdf: "PDF",
  doc: "DOC",
  docx: "DOCX",
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDisplayDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatMonthYear(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  });
}

export function formatDuration(
  startDate: string,
  endDate: string,
  currentlyWorking: boolean,
): string {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "";

  const end = currentlyWorking || !endDate ? new Date() : new Date(endDate);
  if (Number.isNaN(end.getTime()) || end < start) return "";

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  months = Math.max(0, months);

  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years === 1 ? "" : "s"}`);
  if (remMonths > 0 || years === 0) {
    parts.push(`${remMonths} mo${remMonths === 1 ? "" : "s"}`);
  }
  return parts.join(" ");
}

export function formatExperienceRange(experience: CareerExperience): string {
  const start = formatMonthYear(experience.startDate);
  const end = experience.currentlyWorking
    ? "Present"
    : formatMonthYear(experience.endDate);
  const duration = formatDuration(
    experience.startDate,
    experience.endDate,
    experience.currentlyWorking,
  );
  return duration ? `${start} — ${end} • ${duration}` : `${start} — ${end}`;
}

export function detectResumeFileType(fileName: string): ResumeFileType | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_TYPE[ext] ?? null;
}

export function validateResumeFile(file: File): string | null {
  const type = detectResumeFileType(file.name);
  if (!type) {
    return "Please upload a PDF, DOC, or DOCX file.";
  }
  if (file.size > MAX_RESUME_BYTES) {
    return "File size must be less than 5 MB.";
  }
  return null;
}

export function sortExperienceNewestFirst(
  items: CareerExperience[],
): CareerExperience[] {
  return [...items].sort((a, b) => {
    if (a.currentlyWorking !== b.currentlyWorking) {
      return a.currentlyWorking ? -1 : 1;
    }
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });
}
