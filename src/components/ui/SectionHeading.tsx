import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  titleId?: string;
  description?: string;
  align?: "left" | "center";
  light?: boolean;
  className?: string;
  children?: ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  titleId,
  description,
  align = "center",
  light = false,
  className = "",
  children,
}: SectionHeadingProps) {
  const alignment = align === "center" ? "mx-auto text-center items-center" : "items-start text-left";
  const hasMarginOverride = /\bmb-/.test(className);
  const margin = hasMarginOverride ? "" : "mb-12 md:mb-16";

  return (
    <div className={`flex max-w-2xl flex-col gap-4 ${margin} ${alignment} ${className}`.trim()}>
      {eyebrow ? (
        <span
          className={`text-xs font-semibold uppercase tracking-[0.16em] ${
            light ? "text-background/80" : "text-primary"
          }`}
        >
          {eyebrow}
        </span>
      ) : null}
      <h2
        id={titleId}
        className={`text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15] ${
          light ? "text-background" : "text-text"
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`max-w-xl text-base leading-relaxed sm:text-lg ${
            light ? "text-background/70" : "text-muted"
          }`}
        >
          {description}
        </p>
      ) : null}
      {children}
    </div>
  );
}
