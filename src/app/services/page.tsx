import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ServicesHero, ServicesOverview } from "@/components/services/ServicesOverview";
import { siteConfig } from "@/lib/constants";
import { servicesOverviewIntro } from "@/lib/services-content";

export const metadata: Metadata = {
  title: `Services — ${siteConfig.name}`,
  description: servicesOverviewIntro.subtitle,
};

export default function ServicesPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen max-w-6xl px-5 pb-16 pt-28 sm:px-8">
        <ServicesHero />
        <div className="mt-14 sm:mt-16">
          <ServicesOverview />
        </div>
      </main>
      <Footer />
    </>
  );
}
