import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { popularVacancies } from "@/lib/constants";

function formatOpenPositions(count: number) {
  return count.toLocaleString("en-US");
}

export function PopularVacancies() {
  return (
    <section className="border-t border-border/60 bg-card py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-text sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
            Most Popular Vacancies
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-10">
          {popularVacancies.map((item, i) => (
            <Reveal key={item.slug} delay={i * 0.03}>
              <Link
                href={`/jobs?module=${item.slug}`}
                className="group block space-y-2 py-1"
              >
                <span className="block text-lg font-semibold text-text transition group-hover:text-primary group-hover:underline sm:text-xl">
                  {item.name}
                </span>
                <span className="block text-sm text-muted sm:text-[15px]">
                  {formatOpenPositions(item.openPositions)} Open Positions
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
