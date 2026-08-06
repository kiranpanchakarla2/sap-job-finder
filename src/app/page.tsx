import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { HeroStats } from "@/components/HeroStats";
import { PopularVacancies } from "@/components/PopularVacancies";
import { HowItWorks } from "@/components/HowItWorks";
import { FeaturedJobs } from "@/components/FeaturedJobs";
import { TopCompanies } from "@/components/TopCompanies";
import { LatestJobs } from "@/components/LatestJobs";
import { Testimonials } from "@/components/Testimonials";
import { DualCtaBanners } from "@/components/DualCtaBanners";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HeroStats />
        <PopularVacancies />
        <HowItWorks />
        <FeaturedJobs />
        <TopCompanies />
        <LatestJobs />
        <Testimonials />
        <DualCtaBanners />
      </main>
      <Footer />
    </>
  );
}
