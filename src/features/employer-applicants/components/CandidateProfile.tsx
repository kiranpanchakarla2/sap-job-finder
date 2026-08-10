import type { ReactNode } from "react";
import { formatExperienceYears } from "../lib/format";
import type { EmployerApplication } from "../types/application.types";

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
      <h2 className="text-base font-semibold text-text">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function CandidateProfile({
  application,
}: {
  application: EmployerApplication;
}) {
  return (
    <div className="space-y-4">
      <Section title="Professional Summary">
        <p className="text-sm leading-relaxed text-muted">{application.summary}</p>
      </Section>

      <Section title="Experience">
        <ul className="space-y-4">
          {application.workExperience.map((item) => (
            <li key={item.id}>
              <p className="text-sm font-semibold text-text">{item.role}</p>
              <p className="text-xs text-muted">
                {item.company} · {item.duration}
              </p>
              <p className="mt-1.5 text-sm text-muted">{item.description}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">
          Total experience: {formatExperienceYears(application.experienceYears)}
        </p>
      </Section>

      <Section title="SAP Skills">
        <div className="flex flex-wrap gap-2">
          {application.sapSkills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text"
            >
              {skill}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Certifications">
        {application.certifications.length ? (
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
            {application.certifications.map((cert) => (
              <li key={cert}>{cert}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No certifications listed.</p>
        )}
      </Section>

      <Section title="Education">
        <ul className="space-y-3">
          {application.education.map((item) => (
            <li key={item.id}>
              <p className="text-sm font-semibold text-text">{item.degree}</p>
              <p className="text-xs text-muted">
                {item.institution} · {item.year}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Additional Details">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Languages
            </dt>
            <dd className="mt-1 text-sm text-text">
              {application.languages.join(", ")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Location
            </dt>
            <dd className="mt-1 text-sm text-text">{application.location}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Availability
            </dt>
            <dd className="mt-1 text-sm text-text">{application.availability}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Expected Salary
            </dt>
            <dd className="mt-1 text-sm text-text">{application.expectedSalary}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Notice Period
            </dt>
            <dd className="mt-1 text-sm text-text">{application.noticePeriod}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Email
            </dt>
            <dd className="mt-1 text-sm text-text">{application.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Phone
            </dt>
            <dd className="mt-1 text-sm text-text">{application.phone}</dd>
          </div>
        </dl>
      </Section>
    </div>
  );
}
