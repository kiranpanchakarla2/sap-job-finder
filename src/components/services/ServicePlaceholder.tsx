import { Button } from "@/components/ui/Button";

type ServicePlaceholderProps = {
  title: string;
  description: string;
};

export function ServicePlaceholder({ title, description }: ServicePlaceholderProps) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft sm:p-8">
      <h2 className="text-xl font-bold text-text">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        {description}
      </p>
      <p className="mt-4 text-sm text-muted">Full experience launching soon.</p>
      <div className="mt-6">
        <Button href="/signup">Get started</Button>
      </div>
    </section>
  );
}
