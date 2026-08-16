import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { HeroStats } from "@/components/HeroStats";
import { PopularVacancies } from "@/components/PopularVacancies";
import { HowItWorks } from "@/components/HowItWorks";
import { HomeContactSection } from "@/components/HomeContactSection";
import { FeaturedJobs } from "@/components/FeaturedJobs";
import { TopCompanies } from "@/components/TopCompanies";
import { LatestJobs } from "@/components/LatestJobs";
import { Testimonials } from "@/components/Testimonials";
import { DualCtaBanners } from "@/components/DualCtaBanners";
import { PublicLayout } from "@/layouts/PublicLayout";

export default function HomePage() {
  return (
    <PublicLayout>
      <Navbar />
      <main>
        <Hero />
        <HeroStats />
        <PopularVacancies />
        <HowItWorks />
        <HomeContactSection />
        <FeaturedJobs />
        <TopCompanies />
        <LatestJobs />
        <Testimonials />
        <DualCtaBanners />
      </main>
    </PublicLayout>
  );
}
