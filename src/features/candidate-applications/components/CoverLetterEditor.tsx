"use client";

export function CoverLetterEditor({
  value,
  onChange,
  required,
  minChars,
  maxChars,
}: {
  value: string;
  onChange: (value: string) => void;
  required: boolean;
  minChars: number;
  maxChars: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-text">Cover Letter</h2>
          <p className="mt-1 text-sm text-muted">
            Tell the employer why you&apos;re a strong fit for this role.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            required ? "bg-amber-500/10 text-amber-800" : "bg-surface text-muted"
          }`}
        >
          {required ? "Required" : "Optional"}
        </span>
      </div>

      <label htmlFor="cover-letter" className="sr-only">
        Cover letter
      </label>
      <textarea
        id="cover-letter"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxChars))}
        rows={10}
        placeholder="Introduce yourself and explain why your experience and skills make you a good fit for this position..."
        className="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 py-3 text-sm text-text outline-none focus:ring-2 focus:ring-primary/20"
        aria-describedby="cover-letter-count"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          {required
            ? `Minimum ${minChars} characters for this role.`
            : "Cover letter is optional for this role."}
        </span>
        <span id="cover-letter-count">
          {value.length} / {maxChars}
        </span>
      </div>
    </div>
  );
}
