import type { ReactNode } from "react";
import { formatApplicationDate, formatJobContext } from "../lib/format";
import type { EmployerApplication } from "../types/application.types";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-text">{children}</dd>
    </div>
  );
}

export function ApplicationDetails({
  application,
}: {
  application: EmployerApplication;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
      <h2 className="text-base font-semibold text-text">Application Details</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <DetailRow label="Applied Job">{application.appliedJobTitle}</DetailRow>
        <DetailRow label="Application Date">
          {formatApplicationDate(application.applicationDate, "long")}
        </DetailRow>
        <DetailRow label="Application Status">
          <ApplicationStatusBadge status={application.status} />
        </DetailRow>
        <DetailRow label="Job Location">
          {formatJobContext({
            location: application.jobLocation,
            workArrangement: application.workArrangement,
          })}
        </DetailRow>
        <DetailRow label="Employment Type">{application.employmentType}</DetailRow>
        <DetailRow label="SAP Module">{application.sapModule}</DetailRow>
      </dl>
    </section>
  );
}
