import { Navbar } from "@/components/Navbar";
import { CompanyCard } from "@/components/company/CompanyCard";
import { PublicLayout } from "@/layouts/PublicLayout";
import { mockCompanies } from "@/lib/mock-data";

export default function CompaniesPage() {
  return (
    <PublicLayout>
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-28 sm:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-text">Companies</h1>
        <p className="mt-1 text-sm text-muted">
          Explore employers hiring SAP talent across India and beyond.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockCompanies.map((c) => (
            <CompanyCard key={c.id} company={c} />
          ))}
        </div>
      </main>
    </PublicLayout>
  );
}
