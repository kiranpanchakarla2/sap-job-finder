import { Reveal } from "@/components/ui/Reveal";
import { heroStats } from "@/lib/constants";

export function HeroStats() {
  return (
    <section className="relative border-y border-border/70 bg-card/60 backdrop-blur-sm">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-10 sm:px-8 md:grid-cols-4 md:gap-8 md:py-12">
        {heroStats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.05} className="text-center md:text-left">
            <p className="text-2xl font-bold tracking-tight text-text sm:text-3xl">{stat.value}</p>
            <p className="mt-1 text-sm text-muted">{stat.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
