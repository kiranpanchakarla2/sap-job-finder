import { timeToMinutes } from "./format";
import type { InterviewType } from "../types/interview.types";

export type InterviewFormValues = {
  applicationId: string;
  jobId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  type: InterviewType;
  meetingLink: string;
  phoneNumber: string;
  location: string;
  interviewerNames: string[];
  timezone: string;
};

export type InterviewFormErrors = Partial<
  Record<keyof InterviewFormValues | "form", string>
>;

export function validateInterviewForm(
  values: InterviewFormValues,
  options?: { requireCandidate?: boolean },
): InterviewFormErrors {
  const errors: InterviewFormErrors = {};
  const requireCandidate = options?.requireCandidate ?? true;

  if (requireCandidate && !values.applicationId) {
    errors.applicationId = "Select a shortlisted candidate.";
  }

  if (!values.jobId) {
    errors.jobId = "Job is required for the selected candidate.";
  }

  if (!values.scheduledDate) {
    errors.scheduledDate = "Interview date is required.";
  } else if (Number.isNaN(new Date(`${values.scheduledDate}T00:00:00`).getTime())) {
    errors.scheduledDate = "Enter a valid interview date.";
  }

  if (!values.startTime) {
    errors.startTime = "Start time is required.";
  }

  if (!values.endTime) {
    errors.endTime = "End time is required.";
  }

  if (values.startTime && values.endTime) {
    if (timeToMinutes(values.endTime) <= timeToMinutes(values.startTime)) {
      errors.endTime = "End time must be after start time.";
    }
  }

  if (values.type === "video" && !values.meetingLink.trim()) {
    errors.meetingLink = "Meeting link is required for video interviews.";
  }

  if (values.type === "phone" && !values.phoneNumber.trim()) {
    errors.phoneNumber = "Phone number is required for phone interviews.";
  }

  if (values.type === "in_person" && !values.location.trim()) {
    errors.location = "Location is required for in-person interviews.";
  }

  if (values.interviewerNames.length === 0) {
    errors.interviewerNames = "Add at least one interviewer.";
  }

  if (!values.timezone.trim()) {
    errors.timezone = "Timezone is required.";
  }

  return errors;
}
