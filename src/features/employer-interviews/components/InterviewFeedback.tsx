"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";
import {
  INTERVIEW_RECOMMENDATION_LABELS,
  INTERVIEW_RECOMMENDATION_OPTIONS,
} from "../constants";
import {
  formatSubmittedAt,
  getRecommendationLabel,
} from "../lib/format";
import type {
  EmployerInterview,
  InterviewRecommendation,
  SaveFeedbackInput,
} from "../types/interview.types";

const inputClass =
  "w-full rounded-[var(--radius-control)] border border-border bg-input px-3 py-2.5 text-sm text-input-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20";

const labelClass = "mb-1.5 block text-sm font-semibold text-text";

function RatingField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <NativeSelect
        id={id}
        value={String(value)}
        onChange={(event) => onChange(Number(event.target.value))}
        className={inputClass}
      >
        {[1, 2, 3, 4, 5].map((score) => (
          <option key={score} value={score}>
            {score} / 5
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}

export function InterviewFeedback({
  interview,
  loading = false,
  onCancel,
  onSubmit,
  onHire,
  onReject,
}: {
  interview: EmployerInterview;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (input: SaveFeedbackInput) => Promise<void>;
  onHire?: () => void;
  onReject?: () => void;
}) {
  const formId = useId();
  const existing = interview.feedback;

  const [overallRating, setOverallRating] = useState(existing?.overallRating ?? 3);
  const [technicalSkills, setTechnicalSkills] = useState(
    existing?.technicalSkills ?? 3,
  );
  const [communication, setCommunication] = useState(
    existing?.communication ?? 3,
  );
  const [sapKnowledge, setSapKnowledge] = useState(existing?.sapKnowledge ?? 3);
  const [problemSolving, setProblemSolving] = useState(
    existing?.problemSolving ?? 3,
  );
  const [strengths, setStrengths] = useState(existing?.strengths ?? "");
  const [concerns, setConcerns] = useState(existing?.concerns ?? "");
  const [recommendation, setRecommendation] = useState<InterviewRecommendation>(
    existing?.recommendation ?? "maybe",
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!strengths.trim()) {
      setError("Please add candidate strengths.");
      return;
    }
    setError(null);
    await onSubmit({
      overallRating,
      technicalSkills,
      communication,
      sapKnowledge,
      problemSolving,
      strengths: strengths.trim(),
      concerns: concerns.trim(),
      recommendation,
    });
  };

  return (
    <div className="space-y-5">
      {existing ? (
        <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
          <h2 className="text-base font-semibold text-text">Feedback submitted</h2>
          <p className="mt-1 text-sm text-muted">
            Saved {formatSubmittedAt(existing.submittedAt)} · Recommendation:{" "}
            {getRecommendationLabel(existing.recommendation)}
          </p>
          {(onHire || onReject) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {onHire ? <Button onClick={onHire}>Hire Candidate</Button> : null}
              {onReject ? (
                <Button variant="secondary" onClick={onReject}>
                  Reject Candidate
                </Button>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-5 rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-6"
        noValidate
      >
        <div>
          <h2 className="text-lg font-semibold text-text">Interview Feedback</h2>
          <p className="mt-1 text-sm text-muted">
            Record ratings and a recommendation for {interview.candidateName}.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <RatingField
            id={`${formId}-overall`}
            label="Overall Rating"
            value={overallRating}
            onChange={setOverallRating}
          />
          <RatingField
            id={`${formId}-technical`}
            label="Technical Skills"
            value={technicalSkills}
            onChange={setTechnicalSkills}
          />
          <RatingField
            id={`${formId}-communication`}
            label="Communication"
            value={communication}
            onChange={setCommunication}
          />
          <RatingField
            id={`${formId}-sap`}
            label="SAP Knowledge"
            value={sapKnowledge}
            onChange={setSapKnowledge}
          />
          <RatingField
            id={`${formId}-problem`}
            label="Problem Solving"
            value={problemSolving}
            onChange={setProblemSolving}
          />
          <div>
            <label htmlFor={`${formId}-recommendation`} className={labelClass}>
              Recommendation
            </label>
            <NativeSelect
              id={`${formId}-recommendation`}
              value={recommendation}
              onChange={(event) =>
                setRecommendation(event.target.value as InterviewRecommendation)
              }
              className={inputClass}
            >
              {INTERVIEW_RECOMMENDATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {INTERVIEW_RECOMMENDATION_LABELS[option]}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <div>
          <label htmlFor={`${formId}-strengths`} className={labelClass}>
            Strengths
          </label>
          <textarea
            id={`${formId}-strengths`}
            className={`${inputClass} min-h-24 resize-y`}
            value={strengths}
            onChange={(event) => setStrengths(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor={`${formId}-concerns`} className={labelClass}>
            Concerns
          </label>
          <textarea
            id={`${formId}-concerns`}
            className={`${inputClass} min-h-24 resize-y`}
            value={concerns}
            onChange={(event) => setConcerns(event.target.value)}
          />
        </div>

        {error ? (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}

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
            {loading ? "Saving…" : "Save Feedback"}
          </Button>
        </div>
      </form>
    </div>
  );
}
