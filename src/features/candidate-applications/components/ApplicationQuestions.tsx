"use client";

import type { ApplicationQuestion } from "../types/application.types";

type AnswerValue = string | number | boolean | string[] | null;

export function ApplicationQuestionRenderer({
  question,
  value,
  onChange,
  error,
}: {
  question: ApplicationQuestion;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  error?: string | null;
}) {
  const id = `question-${question.id}`;

  return (
    <section
      className="rounded-[24px] border border-border bg-card p-6 shadow-soft sm:p-7"
      aria-labelledby={`${id}-label`}
    >
      <h3 id={`${id}-label`} className="text-lg font-semibold tracking-tight text-text sm:text-xl">
        {question.question}
        {question.required ? (
          <span className="ml-1 text-error" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-2 text-sm font-medium text-muted">Optional</span>
        )}
      </h3>

      <div className="mt-4">
        {question.type === "text" ? (
          <input
            id={id}
            type="text"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            aria-required={question.required}
            aria-invalid={Boolean(error)}
          />
        ) : null}

        {question.type === "textarea" ? (
          <textarea
            id={id}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            rows={4}
            className="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            aria-required={question.required}
            aria-invalid={Boolean(error)}
          />
        ) : null}

        {question.type === "number" ? (
          <input
            id={id}
            type="number"
            min={0}
            value={typeof value === "number" ? value : value === "" || value == null ? "" : Number(value)}
            onChange={(e) =>
              onChange(e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder={question.placeholder}
            className="w-full max-w-xs rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            aria-required={question.required}
            aria-invalid={Boolean(error)}
          />
        ) : null}

        {question.type === "yesNo" ? (
          <div className="flex flex-wrap gap-3" role="radiogroup" aria-labelledby={`${id}-label`}>
            {[true, false].map((option) => {
              const selected = value === option;
              return (
                <button
                  key={String(option)}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange(option)}
                  className={`inline-flex h-10 min-w-20 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    selected
                      ? "border-primary bg-primary text-white shadow-soft"
                      : "border-border bg-surface text-text hover:border-primary/30 hover:bg-primary/5"
                  }`}
                >
                  {option ? "Yes" : "No"}
                </button>
              );
            })}
          </div>
        ) : null}

        {question.type === "singleSelect" ? (
          <select
            id={id}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value || null)}
            className="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            aria-required={question.required}
            aria-invalid={Boolean(error)}
          >
            <option value="">Select an option</option>
            {(question.options ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : null}

        {question.type === "multiSelect" ? (
          <div className="flex flex-wrap gap-2">
            {(question.options ?? []).map((option) => {
              const selected = Array.isArray(value) && value.includes(option);
              return (
                <label
                  key={option}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selected}
                    onChange={() => {
                      const current = Array.isArray(value) ? value : [];
                      onChange(
                        selected
                          ? current.filter((item) => item !== option)
                          : [...current, option],
                      );
                    }}
                  />
                  {option}
                </label>
              );
            })}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-2 text-xs font-medium text-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

export function ApplicationQuestionsForm({
  questions,
  answers,
  onChange,
  fieldError,
}: {
  questions: ApplicationQuestion[];
  answers: Record<string, AnswerValue>;
  onChange: (questionId: string, value: AnswerValue) => void;
  fieldError?: string | null;
}) {
  if (!questions.length) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card px-5 py-10 text-center">
        <p className="text-sm font-semibold text-text">No additional questions</p>
        <p className="mt-1 text-sm text-muted">
          This employer didn&apos;t add screening questions for this role.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-text">Additional Questions</h2>
        <p className="mt-2 text-lg text-muted">
          Answer the employer&apos;s questions to complete your application.
        </p>
      </div>
      {questions.map((question) => (
        <ApplicationQuestionRenderer
          key={question.id}
          question={question}
          value={answers[question.id] ?? null}
          onChange={(value) => onChange(question.id, value)}
          error={
            fieldError && question.required && (answers[question.id] == null || answers[question.id] === "")
              ? "This question is required."
              : null
          }
        />
      ))}
    </div>
  );
}
