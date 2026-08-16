"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileCheck,
  History,
  Info,
  Loader2,
  Lock,
  RotateCcw,
  Send,
  Trash2,
  UploadCloud,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/auth/AuthContext";
import { useCandidateProfile } from "@/features/candidate-profile/hooks/useCandidateProfile";
import {
  CANDIDATE_CONTACT_CATEGORIES,
  CONTACT_ATTACHMENT_CONFIG,
  CONTACT_REQUEST_CATEGORIES,
} from "@/lib/constants";
import {
  contactFormSchema,
  formatFileSize,
  validateContactFile,
  type ContactAttachmentState,
  type ContactFormValues,
} from "@/lib/validations/contact";
import { createContactRequest, uploadContactAttachment } from "@/services/contactService";
import type { ContactRequest, ContactRequestCategory } from "@/types/contact";

export interface CandidateContactFormProps {
  initialCategory?: ContactRequestCategory;
  initialSubject?: string;
  initialMessage?: string;
  contextJobId?: string;
  contextJobTitle?: string;
  contextApplicationId?: string;
  onSuccess?: (createdRequest: ContactRequest) => void;
  onViewRequests?: () => void;
}

export function CandidateContactForm({
  initialCategory,
  initialSubject,
  initialMessage,
  contextJobId,
  contextJobTitle,
  contextApplicationId,
  onSuccess,
  onViewRequests,
}: CandidateContactFormProps) {
  const { user, profile } = useAuth();
  const { profile: candidateProfileData } = useCandidateProfile();
  const reduceMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<ContactAttachmentState>({
    file: null,
    name: "",
    size: 0,
    error: null,
  });
  const [isDragging, setIsDragging] = useState(false);

  const baseId = useId();
  const nameId = `${baseId}-name`;
  const emailId = `${baseId}-email`;
  const categoryId = `${baseId}-category`;
  const subjectId = `${baseId}-subject`;
  const messageId = `${baseId}-message`;
  const attachmentId = `${baseId}-attachment`;

  // Filter category choices to only candidate-relevant ones
  const candidateCategories = CONTACT_REQUEST_CATEGORIES.filter((cat) =>
    (CANDIDATE_CONTACT_CATEGORIES as readonly string[]).includes(cat.value),
  );

  // Compute default pre-filled values
  const defaultName =
    user?.name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    [
      candidateProfileData?.personal?.firstName,
      candidateProfileData?.personal?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "";

  const defaultEmail =
    user?.email ||
    profile?.email ||
    candidateProfileData?.personal?.email ||
    "";

  // Build context-aware initial subject if provided
  let computedInitialSubject = initialSubject || "";
  if (!computedInitialSubject) {
    if (contextJobTitle) {
      computedInitialSubject = `Inquiry regarding SAP Job: ${contextJobTitle}`;
    } else if (contextApplicationId) {
      computedInitialSubject = `Inquiry regarding Application #${contextApplicationId.slice(0, 8)}`;
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: defaultName,
      email: defaultEmail,
      category: initialCategory || (contextJobId || contextApplicationId ? "job_application" : undefined),
      subject: computedInitialSubject,
      message: initialMessage || "",
      website_hp: "",
    },
    mode: "onBlur",
  });

  const messageValue = watch("message") || "";

  // Auto-sync profile name & email when loaded
  useEffect(() => {
    if (defaultName) {
      setValue("name", defaultName, { shouldValidate: false });
    }
    if (defaultEmail) {
      setValue("email", defaultEmail, { shouldValidate: false });
    }
  }, [defaultName, defaultEmail, setValue]);

  // Sync category if initialCategory changes
  useEffect(() => {
    if (initialCategory) {
      setValue("category", initialCategory, { shouldValidate: false });
    }
  }, [initialCategory, setValue]);

  // Sync subject if context changes
  useEffect(() => {
    if (computedInitialSubject) {
      setValue("subject", computedInitialSubject, { shouldValidate: false });
    }
  }, [computedInitialSubject, setValue]);

  // Handle local file selection
  const handleFileChange = (file: File | null) => {
    if (!file) return;

    const validation = validateContactFile(file);
    if (!validation.valid) {
      setAttachment({
        file: null,
        name: file.name,
        size: file.size,
        error: validation.error,
      });
      return;
    }

    setAttachment({
      file,
      name: file.name,
      size: file.size,
      error: null,
    });
  };

  const removeAttachment = () => {
    setAttachment({ file: null, name: "", size: 0, error: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (values: ContactFormValues) => {
    setSubmitError(null);

    // Spam honeypot trap: if bot filled this hidden field, fake success
    if (values.website_hp && values.website_hp.length > 0) {
      setIsSuccess(true);
      return;
    }

    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;
    let attachmentSize: number | null = null;

    // 1. Upload attachment to private candidate storage if attached
    if (attachment.file) {
      const uploadRes = await uploadContactAttachment(attachment.file, {
        isAnonymous: false,
      });

      if (!uploadRes.success) {
        setSubmitError(uploadRes.error || "Failed to upload attachment. Please try again.");
        return;
      }

      attachmentUrl = uploadRes.path;
      attachmentName = uploadRes.name;
      attachmentSize = uploadRes.size;
    }

    // 2. Submit Contact Request to database service as authenticated candidate
    const createRes = await createContactRequest({
      name: values.name.trim(),
      email: defaultEmail || values.email.trim(),
      category: values.category,
      subject: values.subject.trim(),
      message: values.message.trim(),
      user_type: "candidate",
      company_id: null,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
      attachment_size: attachmentSize,
    });

    if (!createRes.success) {
      setSubmitError(
        createRes.error ||
          "We couldn't send your request right now. Please check your connection and try again.",
      );
      return;
    }

    // 3. Mark success
    toast.success("Your request has been submitted to support.");
    setIsSuccess(true);
    if (onSuccess && createRes.data) {
      onSuccess(createRes.data);
    }
  };

  const handleResetForm = () => {
    reset({
      name: defaultName,
      email: defaultEmail,
      category: initialCategory || undefined,
      subject: "",
      message: "",
      website_hp: "",
    });
    removeAttachment();
    setSubmitError(null);
    setIsSuccess(false);
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="rounded-[var(--radius-card)] border border-border bg-card p-8 shadow-soft sm:p-12 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 ring-8 ring-emerald-500/5">
          <CheckCircle2 size={36} aria-hidden="true" />
        </div>

        <h2 className="mt-6 text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Your message has been sent
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
          Thanks for contacting SAP Jobs Finder. We&apos;ve received your request and our support team will
          review it promptly.
        </p>

        <p className="mx-auto mt-2 max-w-md text-xs text-muted leading-relaxed">
          We&apos;ll contact you using your registered email address ({defaultEmail || "your account email"}) if a response is required.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/candidate/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-surface border border-border px-5 py-3 text-sm font-semibold text-text hover:border-primary/40 hover:bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            <span>Back to Candidate Dashboard</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>

          {onViewRequests ? (
            <button
              type="button"
              onClick={onViewRequests}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary/10 border border-primary/20 text-primary px-5 py-3 text-sm font-semibold hover:bg-primary/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <History size={16} aria-hidden="true" />
              <span>View My Requests</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleResetForm}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary text-white px-5 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-[var(--shadow-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            <RotateCcw size={16} aria-hidden="true" />
            <span>Send Another Message</span>
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft sm:p-8 lg:p-10">
      {/* Contextual Job or Application Banner */}
      {contextJobTitle || contextApplicationId ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs sm:text-sm text-text">
          <Briefcase size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-semibold text-primary">Contextual Reference Attached</p>
            <p className="mt-0.5 text-xs text-muted">
              {contextJobTitle && `Job: ${contextJobTitle} `}
              {contextJobId && `(${contextJobId}) `}
              {contextApplicationId && `• Application ID: ${contextApplicationId}`}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text sm:text-2xl">
            Send a Support Request
          </h2>
          <p className="mt-1 text-sm text-muted">
            Our candidate support team typically responds within 24–48 business hours.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
          <UserCheck size={14} className="text-emerald-500" aria-hidden="true" />
          <span>Candidate Account</span>
        </div>
      </div>

      {submitError ? (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" aria-hidden="true" />
          <div>
            <p className="font-semibold">Unable to submit request</p>
            <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{submitError}</p>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Anti-spam honeypot */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor={`${baseId}-hp`}>Leave this field blank</label>
          <input
            id={`${baseId}-hp`}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("website_hp")}
          />
        </div>

        {/* Row 1: Candidate Name & Account Email */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Name Field */}
          <div>
            <label htmlFor={nameId} className="block text-sm font-medium text-text">
              Name <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id={nameId}
              type="text"
              autoComplete="name"
              placeholder="e.g. Kiran Sharma"
              aria-required="true"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${nameId}-error` : undefined}
              className={`mt-1.5 w-full rounded-[var(--radius-control)] border bg-background px-4 py-2.5 text-sm text-text outline-none transition-all placeholder:text-muted/60 ${
                errors.name
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-400/20"
                  : "border-border hover:border-muted/80 focus:border-primary focus:ring-2 focus:ring-primary/20"
              }`}
              {...register("name")}
            />
            {errors.name ? (
              <p
                id={`${nameId}-error`}
                role="alert"
                className="mt-1.5 text-xs font-medium text-red-500"
              >
                {errors.name.message}
              </p>
            ) : null}
          </div>

          {/* Email Field (Read-only for candidate account consistency) */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor={emailId} className="block text-sm font-medium text-text">
                Account Email <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted">
                <Lock size={11} aria-hidden="true" />
                <span>Verified</span>
              </span>
            </div>
            <input
              id={emailId}
              type="email"
              readOnly
              value={defaultEmail}
              aria-required="true"
              aria-readonly="true"
              className="mt-1.5 w-full rounded-[var(--radius-control)] border border-border bg-surface px-4 py-2.5 text-sm text-muted cursor-not-allowed outline-none select-all"
              {...register("email")}
            />
            <p className="mt-1 text-[11px] text-muted">
              Replies will be sent to your registered account email.
            </p>
          </div>
        </div>

        {/* Row 2: Candidate Category Selector */}
        <div>
          <label htmlFor={categoryId} className="block text-sm font-medium text-text">
            Category / Topic <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <div className="relative mt-1.5">
            <select
              id={categoryId}
              defaultValue={initialCategory || ""}
              aria-required="true"
              aria-invalid={Boolean(errors.category)}
              aria-describedby={errors.category ? `${categoryId}-error` : undefined}
              className={`w-full rounded-[var(--radius-control)] border bg-background px-4 py-2.5 text-sm text-text outline-none transition-all ${
                errors.category
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-400/20"
                  : "border-border hover:border-muted/80 focus:border-primary focus:ring-2 focus:ring-primary/20"
              }`}
              {...register("category")}
            >
              <option value="" disabled>
                Select a candidate topic…
              </option>
              {candidateCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label} — {cat.description}
                </option>
              ))}
            </select>
          </div>
          {errors.category ? (
            <p
              id={`${categoryId}-error`}
              role="alert"
              className="mt-1.5 text-xs font-medium text-red-500"
            >
              {errors.category.message}
            </p>
          ) : null}
        </div>

        {/* Row 3: Subject Field */}
        <div>
          <label htmlFor={subjectId} className="block text-sm font-medium text-text">
            Subject <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id={subjectId}
            type="text"
            placeholder="e.g. Question regarding SAP ABAP certification display on profile"
            aria-required="true"
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={errors.subject ? `${subjectId}-error` : undefined}
            className={`mt-1.5 w-full rounded-[var(--radius-control)] border bg-background px-4 py-2.5 text-sm text-text outline-none transition-all placeholder:text-muted/60 ${
              errors.subject
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-400/20"
                : "border-border hover:border-muted/80 focus:border-primary focus:ring-2 focus:ring-primary/20"
            }`}
            {...register("subject")}
          />
          {errors.subject ? (
            <p
              id={`${subjectId}-error`}
              role="alert"
              className="mt-1.5 text-xs font-medium text-red-500"
            >
              {errors.subject.message}
            </p>
          ) : null}
        </div>

        {/* Row 4: Message Field with Live Character Counter */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor={messageId} className="block text-sm font-medium text-text">
              Message <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <span
              className={`text-xs ${
                messageValue.length > 5000
                  ? "font-semibold text-red-500"
                  : "text-muted"
              }`}
              aria-live="polite"
            >
              {messageValue.length.toLocaleString()} / 5,000
            </span>
          </div>
          <textarea
            id={messageId}
            rows={5}
            placeholder="Please provide specific details about your question, problem, or request…"
            aria-required="true"
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? `${messageId}-error` : undefined}
            className={`mt-1.5 w-full resize-y rounded-[var(--radius-control)] border bg-background px-4 py-3 text-sm text-text outline-none transition-all placeholder:text-muted/60 ${
              errors.message
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-400/20"
                : "border-border hover:border-muted/80 focus:border-primary focus:ring-2 focus:ring-primary/20"
            }`}
            {...register("message")}
          />
          {errors.message ? (
            <p
              id={`${messageId}-error`}
              role="alert"
              className="mt-1.5 text-xs font-medium text-red-500"
            >
              {errors.message.message}
            </p>
          ) : null}
        </div>

        {/* Row 5: Attachment Upload (Optional) */}
        <div>
          <label htmlFor={attachmentId} className="block text-sm font-medium text-text">
            Attachment <span className="text-xs font-normal text-muted">(optional)</span>
          </label>

          <input
            ref={fileInputRef}
            id={attachmentId}
            type="file"
            className="sr-only"
            accept={CONTACT_ATTACHMENT_CONFIG.allowedExtensions.join(",")}
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              handleFileChange(file);
            }}
          />

          {!attachment.file ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0] || null;
                handleFileChange(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Upload an attachment. Click or drag and drop a file."
              className={`mt-1.5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-surface hover:border-primary/40 hover:bg-card"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-border text-muted">
                <UploadCloud size={20} aria-hidden="true" />
              </div>
              <p className="mt-2 text-xs font-semibold text-text">
                Click to browse or drag and drop a document/screenshot
              </p>
              <p className="mt-1 text-[11px] text-muted">
                PDF, PNG, JPG, DOC/DOCX, XLS/XLSX, TXT up to {CONTACT_ATTACHMENT_CONFIG.maxSizeLabel}
              </p>
            </div>
          ) : (
            <div className="mt-1.5 flex items-center justify-between rounded-xl border border-border bg-surface p-3.5">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <FileCheck size={18} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-text">{attachment.name}</p>
                  <p className="text-[11px] text-muted">{formatFileSize(attachment.size)}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={removeAttachment}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                aria-label="Remove attachment"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          )}

          {attachment.error ? (
            <p role="alert" className="mt-1.5 text-xs font-medium text-red-500">
              {attachment.error}
            </p>
          ) : null}
        </div>

        {/* Submit Action */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="relative inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-8 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                <span>Sending Request…</span>
              </>
            ) : (
              <>
                <Send size={16} aria-hidden="true" />
                <span>Submit Support Request</span>
              </>
            )}
          </button>

          <p className="text-xs text-muted flex items-center gap-1.5">
            <Info size={13} className="shrink-0" aria-hidden="true" />
            <span>Authenticated under candidate session</span>
          </p>
        </div>
      </form>
    </div>
  );
}
