import { CompanyCard } from "@/components/company/CompanyCard";
import { Reveal } from "@/components/ui/Reveal";
import { mockCompanies } from "@/lib/mock-data";

export function TopCompanies() {
  return (
    <section className="border-t border-border/60 bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-text sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
            Top companies
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {mockCompanies.map((company, i) => (
            <Reveal key={company.id} delay={i * 0.04} className="h-full">
              <CompanyCard company={company} variant="top" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
