import { getCandidateInitials } from "../lib/format";

export function ApplicantAvatar({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg"
      ? "h-16 w-16 text-lg"
      : size === "sm"
        ? "h-9 w-9 text-xs"
        : "h-11 w-11 text-sm";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={`${name} avatar`}
        className={`${sizeClass} shrink-0 rounded-2xl border border-border object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl border border-border bg-primary/10 font-bold text-primary ${sizeClass}`}
    >
      {getCandidateInitials(name)}
    </span>
  );
}
