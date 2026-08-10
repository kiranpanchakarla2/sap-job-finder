import {
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_TYPE_SHORT_LABELS,
  INTERVIEW_RECOMMENDATION_LABELS,
} from "../constants";
import type {
  InterviewRecommendation,
  InterviewStatus,
  InterviewType,
} from "../types/interview.types";

export function getInterviewStatusLabel(status: InterviewStatus): string {
  return INTERVIEW_STATUS_LABELS[status];
}

export function getInterviewTypeLabel(type: InterviewType): string {
  return INTERVIEW_TYPE_LABELS[type];
}

export function getInterviewTypeShortLabel(type: InterviewType): string {
  return INTERVIEW_TYPE_SHORT_LABELS[type];
}

export function getRecommendationLabel(
  recommendation: InterviewRecommendation,
): string {
  return INTERVIEW_RECOMMENDATION_LABELS[recommendation];
}

export function formatInterviewDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsed);
}

export function formatInterviewDateLong(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export function formatInterviewTime(time: string): string {
  const [hoursRaw, minutesRaw] = time.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatInterviewDateTime(date: string, time: string): string {
  return `${formatInterviewDate(date)} · ${formatInterviewTime(time)}`;
}

export function formatSubmittedAt(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

export function todayDateString(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
