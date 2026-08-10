"use client";

import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { contactSection } from "@/lib/services-content";

export function ContactUsSection() {
  const [pending, setPending] = useState(false);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const topic = String(form.get("topic") ?? "");
    const message = String(form.get("message") ?? "");

    const subject = encodeURIComponent(`SAP Jobs Finder — ${topic}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`,
    );

    window.location.href = `mailto:${contactSection.email}?subject=${subject}&body=${body}`;
    toast.success("Opening your email client…");
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
              wrapperClassName="mt-1.5"
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
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            Send message
          </Button>
        </form>
      </div>
    </section>
  );
}
