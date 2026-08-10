"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_APPLICATION_EMAIL,
  DEFAULT_RECRUITER_NAME,
  EMPLOYER_JOB_ROUTES,
} from "../constants";
import { emptyJobFormValues, jobToFormValues } from "../lib/format";
import { savePreviewDraft } from "../lib/previewDraft";
import { jobFormSchema, type JobFormValues } from "../lib/validation";
import { jobService } from "../services/jobService";
import type { EmployerJobRecord } from "../types/job.types";
import { JobFormSummary } from "./JobFormSummary";
import { JobBasicInformation } from "./sections/JobBasicInformation";
import { JobCompensation } from "./sections/JobCompensation";
import { JobDescriptionSection } from "./sections/JobDescription";
import { JobExperienceSection } from "./sections/JobExperience";
import { JobHiringInformation } from "./sections/JobHiringInformation";
import { JobSapInformation } from "./sections/JobSapInformation";

type JobFormProps =
  | { mode: "create"; initialData?: undefined }
  | { mode: "edit"; initialData: EmployerJobRecord };

type PendingAction = "draft" | "preview" | "publish" | "save" | null;

function ActionButton({
  children,
  loading,
  loadingLabel,
  variant = "primary",
  disabled,
  onClick,
}: {
  children: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={variant}
      disabled={disabled || loading}
      onClick={onClick}
      className="!min-w-[8.5rem]"
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
      {loading ? loadingLabel ?? "Please wait…" : children}
    </Button>
  );
}

export function JobForm(props: JobFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingAction>(null);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues:
      props.mode === "edit"
        ? jobToFormValues(props.initialData)
        : emptyJobFormValues({
            recruiter: DEFAULT_RECRUITER_NAME,
            applicationEmail: DEFAULT_APPLICATION_EMAIL,
          }),
    mode: "onSubmit",
  });

  useEffect(() => {
    if (props.mode === "edit") {
      form.reset(jobToFormValues(props.initialData));
    }
  }, [props, form]);

  const runValidated = async (
    action: Exclude<PendingAction, null>,
    handler: (values: JobFormValues) => Promise<void>,
  ) => {
    const valid = await form.trigger();
    if (!valid) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setPending(action);
    try {
      await handler(form.getValues());
    } finally {
      setPending(null);
    }
  };

  const onSaveDraft = () =>
    runValidated("draft", async (values) => {
      if (props.mode === "create") {
        const result = await jobService.createJob(values);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Job draft saved.");
        router.replace(EMPLOYER_JOB_ROUTES.edit(result.data.id));
        return;
      }

      const result = await jobService.updateJob(props.initialData.id, values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Job draft saved.");
    });

  const onPreview = () =>
    runValidated("preview", async (values) => {
      if (props.mode === "create") {
        const profile = await jobService.getCompanyProfileStatus();
        if (!profile.success || !profile.data.ready) {
          toast.error("Complete your company profile before posting a job.");
          return;
        }
        savePreviewDraft({
          values,
          companyName: profile.data.companyName,
          logoUrl: profile.data.logoUrl,
        });
        router.push(EMPLOYER_JOB_ROUTES.createPreview);
        return;
      }

      const result = await jobService.updateJob(props.initialData.id, values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.push(EMPLOYER_JOB_ROUTES.preview(result.data.id));
    });

  const onPublish = () =>
    runValidated("publish", async (values) => {
      if (props.mode === "create") {
        const created = await jobService.createJob(values, { publish: true });
        if (!created.success) {
          toast.error(created.error);
          return;
        }
        toast.success("Job published successfully.");
        router.push(EMPLOYER_JOB_ROUTES.details(created.data.id));
        return;
      }

      const updated = await jobService.updateJob(props.initialData.id, values);
      if (!updated.success) {
        toast.error(updated.error);
        return;
      }
      const published = await jobService.publishJob(props.initialData.id);
      if (!published.success) {
        toast.error(published.error);
        return;
      }
      toast.success("Job published successfully.");
      router.push(EMPLOYER_JOB_ROUTES.details(published.data.id));
    });

  const onSaveChanges = () =>
    runValidated("save", async (values) => {
      if (props.mode !== "edit") return;
      const result = await jobService.updateJob(props.initialData.id, values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Job updated successfully.");
      router.push(EMPLOYER_JOB_ROUTES.details(result.data.id));
    });

  const busy = pending !== null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
      <form className="space-y-5" noValidate onSubmit={(event) => event.preventDefault()}>
        <JobBasicInformation form={form} />
        <JobSapInformation form={form} />
        <JobDescriptionSection form={form} />
        <JobExperienceSection form={form} />
        <JobCompensation form={form} />
        <JobHiringInformation form={form} />

        <div className="sticky bottom-0 z-10 -mx-1 border-t border-border bg-background/95 px-1 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            {props.mode === "create" ? (
              <>
                <ActionButton
                  variant="secondary"
                  loading={pending === "draft"}
                  loadingLabel="Saving draft..."
                  disabled={busy && pending !== "draft"}
                  onClick={() => void onSaveDraft()}
                >
                  Save Draft
                </ActionButton>
                <ActionButton
                  variant="secondary"
                  loading={pending === "preview"}
                  loadingLabel="Preparing preview…"
                  disabled={busy && pending !== "preview"}
                  onClick={() => void onPreview()}
                >
                  Preview
                </ActionButton>
                <ActionButton
                  loading={pending === "publish"}
                  loadingLabel="Publishing…"
                  disabled={busy && pending !== "publish"}
                  onClick={() => void onPublish()}
                >
                  Publish Job
                </ActionButton>
              </>
            ) : (
              <>
                <Button variant="secondary" href={EMPLOYER_JOB_ROUTES.list}>
                  Cancel
                </Button>
                <ActionButton
                  variant="secondary"
                  loading={pending === "preview"}
                  loadingLabel="Preparing preview…"
                  disabled={busy && pending !== "preview"}
                  onClick={() => void onPreview()}
                >
                  Preview
                </ActionButton>
                <ActionButton
                  loading={pending === "save"}
                  loadingLabel="Saving…"
                  disabled={busy && pending !== "save"}
                  onClick={() => void onSaveChanges()}
                >
                  Save Changes
                </ActionButton>
              </>
            )}
          </div>
        </div>
      </form>

      <JobFormSummary watch={form.watch} mode={props.mode} />
    </div>
  );
}
