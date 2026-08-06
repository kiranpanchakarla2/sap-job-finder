import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function FeatureCard({ title, description, icon: Icon }: FeatureCardProps) {
  return (
    <article className="group flex h-full flex-col rounded-[16px] border border-border bg-background p-6 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/20 hover:shadow-lift sm:p-7">
      <span
        className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/12 to-accent/10 text-primary transition-transform duration-300 group-hover:scale-105"
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="text-lg font-semibold tracking-tight text-text">{title}</h3>
      <p className="mt-2.5 text-sm leading-relaxed text-muted">{description}</p>
    </article>
  );
}
