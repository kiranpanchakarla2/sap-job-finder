import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ContactForm, ContactInfoCard } from "@/features/contact";
import { PublicLayout } from "@/layouts/PublicLayout";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Contact Us | ${siteConfig.name}`,
  description:
    "Have a question about SAP Jobs Finder? Contact our team for help with SAP jobs, applications, employer solutions, bulk uploads, and partnerships.",
  openGraph: {
    title: `Contact Us | ${siteConfig.name}`,
    description:
      "Get in touch with the SAP Jobs Finder team. We're here to help candidates, employers, and partners across the SAP ecosystem.",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <PublicLayout>
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        {/* Page Hero Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <MessageSquare size={14} aria-hidden="true" />
            <span>Support & Inquiries</span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-text sm:text-4xl lg:text-5xl">
            Contact Us
          </h1>

          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            We&apos;re here to help you navigate your SAP career and hiring journey. Have a question,
            feedback, or need assistance? Send us a message and our team will get back to you.
          </p>
        </div>

        {/* Content Layout Grid */}
        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:gap-10 items-start">
          {/* Main Form Column (7 cols) */}
          <div className="lg:col-span-7">
            <ContactForm />
          </div>

          {/* Contact Details & FAQ Column (5 cols) */}
          <div className="lg:col-span-5">
            <ContactInfoCard />
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}
