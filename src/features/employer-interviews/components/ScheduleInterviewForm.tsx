"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { ApplicationStatusBadge } from "@/features/employer-applicants/components/ApplicationStatusBadge";
import { INTERVIEW_TYPE_LABELS } from "../constants";
import { interviewService } from "../services/interviewService";
import {
  validateInterviewForm,
  type InterviewFormErrors,
} from "../lib/validateInterview";
import type {
  Interviewer,
  InterviewType,
  ScheduleInterviewInput,
  ShortlistedCandidateOption,
  UpdateInterviewInput,
} from "../types/interview.types";

const inputClass =
  "w-full rounded-[var(--radius-control)] border border-border bg-input px-3 py-2.5 text-sm text-input-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20";

const labelClass = "mb-1.5 block text-sm font-semibold text-text";

const COMMON_TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Singapore",
  "Australia/Sydney",
  "UTC",
];

type Mode = "create" | "edit";

type ScheduleInterviewFormProps = {
  mode: Mode;
  candidates?: ShortlistedCandidateOption[];
  initialApplicationId?: string | null;
  initialValues?: {
    scheduledDate: string;
    startTime: string;
    endTime: string;
    timezone?: string;
    type: InterviewType;
    meetingLink: string;
    phoneNumber: string;
    location: string;
    interviewers: Interviewer[];
    notes: string;
    candidateName?: string;
    jobTitle?: string;
  };
  loading?: boolean;
  onCancel: () => void;
  onSubmitCreate?: (input: ScheduleInterviewInput) => Promise<void>;
  onSubmitEdit?: (input: UpdateInterviewInput) => Promise<void>;
};

function defaultTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function ScheduleInterviewForm({
  mode,
  candidates = [],
  initialApplicationId = null,
  initialValues,
  loading = false,
  onCancel,
  onSubmitCreate,
  onSubmitEdit,
}: ScheduleInterviewFormProps) {
  const formId = useId();
  const suggested = useMemo(() => interviewService.getInterviewers(), []);

  const [applicationId, setApplicationId] = useState(
    initialApplicationId ?? "",
  );
  const [scheduledDate, setScheduledDate] = useState(
    initialValues?.scheduledDate ?? "",
  );
  const [startTime, setStartTime] = useState(initialValues?.startTime ?? "");
  const [endTime, setEndTime] = useState(initialValues?.endTime ?? "");
  const [timezone, setTimezone] = useState(
    initialValues?.timezone ?? defaultTimezone(),
  );
  const [type, setType] = useState<InterviewType>(
    initialValues?.type ?? "video",
  );
  const [meetingLink, setMeetingLink] = useState(
    initialValues?.meetingLink ?? "",
  );
  const [phoneNumber, setPhoneNumber] = useState(
    initialValues?.phoneNumber ?? "",
  );
  const [location, setLocation] = useState(initialValues?.location ?? "");
  const [interviewers, setInterviewers] = useState<Interviewer[]>(
    initialValues?.interviewers ?? [],
  );
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [errors, setErrors] = useState<InterviewFormErrors>({});
  const [addName, setAddName] = useState("");
  const [suggestedId, setSuggestedId] = useState("");

  useEffect(() => {
    if (initialApplicationId) {
      setApplicationId(initialApplicationId);
    }
  }, [initialApplicationId]);

  const selectedCandidate = candidates.find(
    (candidate) => candidate.applicationId === applicationId,
  );

  const timezoneOptions = useMemo(() => {
    const set = new Set([...COMMON_TIMEZONES, timezone]);
    return Array.from(set);
  }, [timezone]);

  const addInterviewerByName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setInterviewers((current) => {
      if (
        current.some(
          (person) => person.name.toLowerCase() === trimmed.toLowerCase(),
        )
      ) {
        return current;
      }
      return [
        ...current,
        {
          id: `ivw_${Date.now()}_${trimmed.toLowerCase().replace(/\s+/g, "_")}`,
          name: trimmed,
        },
      ];
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const formErrors = validateInterviewForm(
      {
        applicationId: mode === "edit" ? "locked" : applicationId,
        jobId: mode === "edit" ? "locked" : selectedCandidate?.jobId ?? "",
        scheduledDate,
        startTime,
        endTime,
        type,
        meetingLink,
        phoneNumber,
        location,
        interviewerNames: interviewers.map((person) => person.name),
        timezone,
      },
      { requireCandidate: mode === "create" },
    );

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setErrors({});

    if (mode === "create" && selectedCandidate && onSubmitCreate) {
      await onSubmitCreate({
        applicationId: selectedCandidate.applicationId,
        candidateId: selectedCandidate.candidateId,
        candidateName: selectedCandidate.candidateName,
        candidateAvatarUrl: selectedCandidate.candidateAvatarUrl,
        candidateRole: selectedCandidate.candidateRole,
        candidateExperienceYears: selectedCandidate.candidateExperienceYears,
        candidateSapSkills: selectedCandidate.candidateSapSkills,
        candidateLocation: selectedCandidate.candidateLocation,
        jobId: selectedCandidate.jobId,
        jobTitle: selectedCandidate.jobTitle,
        sapModule: selectedCandidate.sapModule,
        jobLocation: selectedCandidate.jobLocation,
        employmentType: selectedCandidate.employmentType,
        scheduledDate,
        startTime,
        endTime,
        timezone,
        type,
        meetingLink,
        phoneNumber,
        location,
        interviewers,
        notes,
      });
      return;
    }

    if (mode === "edit" && onSubmitEdit) {
      await onSubmitEdit({
        scheduledDate,
        startTime,
        endTime,
        timezone,
        type,
        meetingLink,
        phoneNumber,
        location,
        interviewers,
        notes,
      });
    }
  };

  return (
    <form
      id={formId}
      onSubmit={(event) => void handleSubmit(event)}
      className="space-y-5 rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-6"
      noValidate
    >
      {mode === "create" ? (
        <div>
          <label htmlFor={`${formId}-candidate`} className={labelClass}>
            Candidate
          </label>
          <NativeSelect
            id={`${formId}-candidate`}
            value={applicationId}
            onChange={(event) => setApplicationId(event.target.value)}
            className={inputClass}
            aria-invalid={Boolean(errors.applicationId)}
          >
            <option value="">Select a shortlisted candidate</option>
            {candidates.map((candidate) => (
              <option
                key={candidate.applicationId}
                value={candidate.applicationId}
              >
                {candidate.candidateName} — {candidate.jobTitle} (Shortlisted)
              </option>
            ))}
          </NativeSelect>
          {errors.applicationId ? (
            <p className="mt-1.5 text-sm text-error" role="alert">
              {errors.applicationId}
            </p>
          ) : null}

          {selectedCandidate ? (
            <div className="mt-3 rounded-[var(--radius-control)] border border-border bg-surface/50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-text">
                  {selectedCandidate.candidateName}
                </p>
                <ApplicationStatusBadge status="shortlisted" />
              </div>
              <p className="mt-1 text-sm text-muted">
                {selectedCandidate.candidateRole}
              </p>
              <p className="mt-1 text-xs text-muted">
                Applied job: {selectedCandidate.jobTitle}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-[var(--radius-control)] border border-border bg-surface/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Candidate &amp; job (locked)
          </p>
          <p className="mt-1 text-sm font-semibold text-text">
            {initialValues?.candidateName}
          </p>
          <p className="mt-0.5 text-sm text-muted">{initialValues?.jobTitle}</p>
        </div>
      )}

      <div>
        <label htmlFor={`${formId}-job`} className={labelClass}>
          Job
        </label>
        <input
          id={`${formId}-job`}
          className={`${inputClass} opacity-90`}
          value={
            mode === "edit"
              ? initialValues?.jobTitle ?? ""
              : selectedCandidate?.jobTitle ?? ""
          }
          readOnly
          aria-readonly="true"
        />
        {errors.jobId ? (
          <p className="mt-1.5 text-sm text-error" role="alert">
            {errors.jobId}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-muted">
            Job is associated automatically with the selected candidate.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor={`${formId}-date`} className={labelClass}>
            Interview Date
          </label>
          <input
            id={`${formId}-date`}
            type="date"
            className={inputClass}
            value={scheduledDate}
            onChange={(event) => setScheduledDate(event.target.value)}
            aria-invalid={Boolean(errors.scheduledDate)}
          />
          {errors.scheduledDate ? (
            <p className="mt-1.5 text-sm text-error" role="alert">
              {errors.scheduledDate}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor={`${formId}-start`} className={labelClass}>
            Start Time
          </label>
          <input
            id={`${formId}-start`}
            type="time"
            className={inputClass}
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            aria-invalid={Boolean(errors.startTime)}
          />
          {errors.startTime ? (
            <p className="mt-1.5 text-sm text-error" role="alert">
              {errors.startTime}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor={`${formId}-end`} className={labelClass}>
            End Time
          </label>
          <input
            id={`${formId}-end`}
            type="time"
            className={inputClass}
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            aria-invalid={Boolean(errors.endTime)}
          />
          {errors.endTime ? (
            <p className="mt-1.5 text-sm text-error" role="alert">
              {errors.endTime}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor={`${formId}-timezone`} className={labelClass}>
            Timezone
          </label>
          <NativeSelect
            id={`${formId}-timezone`}
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            className={inputClass}
            aria-invalid={Boolean(errors.timezone)}
          >
            {timezoneOptions.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </NativeSelect>
          {errors.timezone ? (
            <p className="mt-1.5 text-sm text-error" role="alert">
              {errors.timezone}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor={`${formId}-type`} className={labelClass}>
          Interview Type
        </label>
        <NativeSelect
          id={`${formId}-type`}
          value={type}
          onChange={(event) => setType(event.target.value as InterviewType)}
          className={inputClass}
        >
          {(Object.keys(INTERVIEW_TYPE_LABELS) as InterviewType[]).map(
            (option) => (
              <option key={option} value={option}>
                {INTERVIEW_TYPE_LABELS[option]}
              </option>
            ),
          )}
        </NativeSelect>
      </div>

      {type === "video" ? (
        <div>
          <label htmlFor={`${formId}-link`} className={labelClass}>
            Meeting Link
          </label>
          <input
            id={`${formId}-link`}
            type="url"
            className={inputClass}
            placeholder="https://meet.example.com/..."
            value={meetingLink}
            onChange={(event) => setMeetingLink(event.target.value)}
            aria-invalid={Boolean(errors.meetingLink)}
          />
          {errors.meetingLink ? (
            <p className="mt-1.5 text-sm text-error" role="alert">
              {errors.meetingLink}
            </p>
          ) : null}
        </div>
      ) : null}

      {type === "phone" ? (
        <div>
          <label htmlFor={`${formId}-phone`} className={labelClass}>
            Phone Number
          </label>
          <input
            id={`${formId}-phone`}
            type="tel"
            className={inputClass}
            placeholder="+1 (555) 000-0000"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            aria-invalid={Boolean(errors.phoneNumber)}
          />
          {errors.phoneNumber ? (
            <p className="mt-1.5 text-sm text-error" role="alert">
              {errors.phoneNumber}
            </p>
          ) : null}
        </div>
      ) : null}

      {type === "in_person" ? (
        <div>
          <label htmlFor={`${formId}-location`} className={labelClass}>
            Location
          </label>
          <input
            id={`${formId}-location`}
            type="text"
            className={inputClass}
            placeholder="Office address or meeting room"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            aria-invalid={Boolean(errors.location)}
          />
          {errors.location ? (
            <p className="mt-1.5 text-sm text-error" role="alert">
              {errors.location}
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <p className={labelClass} id={`${formId}-interviewers-label`}>
          Interviewers
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="list"
          aria-labelledby={`${formId}-interviewers-label`}
        >
          {interviewers.map((person) => (
            <span
              key={person.id}
              role="listitem"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text"
            >
              {person.name}
              <button
                type="button"
                onClick={() =>
                  setInterviewers((current) =>
                    current.filter((entry) => entry.id !== person.id),
                  )
                }
                className="rounded-full p-0.5 text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label={`Remove ${person.name}`}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            aria-label="Interviewer name"
            className={inputClass}
            placeholder="Add interviewer name"
            value={addName}
            onChange={(event) => setAddName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addInterviewerByName(addName);
                setAddName("");
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              addInterviewerByName(addName);
              setAddName("");
            }}
            disabled={!addName.trim()}
          >
            Add Interviewer
          </Button>
        </div>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <NativeSelect
            aria-label="Suggested interviewer"
            value={suggestedId}
            onChange={(event) => setSuggestedId(event.target.value)}
            className={inputClass}
            wrapperClassName="flex-1"
          >
            <option value="">Suggested interviewers</option>
            {suggested.map((person) => (
              <option key={person.id} value={person.name}>
                {person.name}
              </option>
            ))}
          </NativeSelect>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (!suggestedId) return;
              addInterviewerByName(suggestedId);
              setSuggestedId("");
            }}
            disabled={!suggestedId}
          >
            Add Suggested
          </Button>
        </div>
        {errors.interviewerNames ? (
          <p className="mt-1.5 text-sm text-error" role="alert">
            {errors.interviewerNames}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${formId}-notes`} className={labelClass}>
          Interview Notes
        </label>
        <textarea
          id={`${formId}-notes`}
          className={`${inputClass} min-h-28 resize-y`}
          placeholder="Focus on S/4HANA implementation experience."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving…"
            : mode === "create"
              ? "Schedule Interview"
              : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
