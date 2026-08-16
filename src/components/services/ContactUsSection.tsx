"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { contactSection } from "@/lib/services-content";
import { createContactRequest } from "@/services/contactService";

export function ContactUsSection() {
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const topic = String(form.get("topic") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();

    const res = await createContactRequest({
      name,
      email,
      category: "general",
      subject: `Inquiry: ${topic}`,
      message: message,
    });

    if (!res.success) {
      toast.error(res.error || "Failed to send message. Please try again.");
      setPending(false);
      return;
    }

    toast.success("Thank you! Your message has been submitted.");
    setSubmitted(true);
    setPending(false);
  };

  return (
    <section
      id="contact"
      className="scroll-mt-28 rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft sm:p-8 lg:p-10"
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            {contactSection.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            {contactSection.subtitle}
          </p>

          <ul className="mt-8 space-y-4 text-sm text-muted">
            <li className="flex items-start gap-3">
              <Mail size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="block font-medium text-text">Email</span>
                <a
                  href={`mailto:${contactSection.email}`}
                  className="hover:text-primary"
                >
                  {contactSection.email}
                </a>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Phone size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="block font-medium text-text">Support hours</span>
                Mon–Fri, 9:00 AM – 6:00 PM IST
              </span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="block font-medium text-text">Coverage</span>
                India & global SAP hiring markets
              </span>
            </li>
          </ul>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Common topics
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {contactSection.topics.map((topic) => (
                <li
                  key={topic}
                  className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted"
                >
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20 p-8 text-center">
            <CheckCircle2 size={40} className="text-emerald-500" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-bold text-text">Message Received</h3>
            <p className="mt-2 text-xs text-muted max-w-sm">
              Thank you for reaching out. Our support team will review your inquiry and get back to you shortly.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <span>Visit full Contact page</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-text">
                Name
              </label>
              <input
                id="contact-name"
                name="name"
                required
                className="mt-1.5 w-full rounded-[var(--radius-control)] border border-border bg-background px-4 py-2.5 text-sm text-text outline-none ring-primary/20 focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-text">
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                className="mt-1.5 w-full rounded-[var(--radius-control)] border border-border bg-background px-4 py-2.5 text-sm text-text outline-none ring-primary/20 focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="contact-topic" className="block text-sm font-medium text-text">
                Topic
              </label>
              <NativeSelect
                id="contact-topic"
                name="topic"
                required
                wrapperClassName="mt-2.5"
                className="rounded-[var(--radius-control)] border border-border bg-background px-4 py-2.5 text-sm text-text outline-none ring-primary/20 focus:ring-2"
              >
                {contactSection.topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-sm font-medium text-text">
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={4}
                className="mt-1.5 w-full resize-y rounded-[var(--radius-control)] border border-border bg-background px-4 py-2.5 text-sm text-text outline-none ring-primary/20 focus:ring-2"
                placeholder="Tell us how we can help…"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
              <Button type="submit" disabled={pending} className="w-full sm:w-auto">
                {pending ? "Sending…" : "Send message"}
              </Button>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Need attachment support? Use full contact form →
              </Link>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
