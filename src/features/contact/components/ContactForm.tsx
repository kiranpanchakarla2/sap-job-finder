"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  FileText,
  Loader2,
  Paperclip,
  RotateCcw,
  Send,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from "@/auth/AuthContext";
import { CONTACT_ATTACHMENT_CONFIG, CONTACT_REQUEST_CATEGORIES } from "@/lib/constants";
import {
  contactFormSchema,
  formatFileSize,
  validateContactFile,
  type ContactAttachmentState,
  type ContactFormValues,
} from "@/lib/validations/contact";
import { createContactRequest, uploadContactAttachment } from "@/services/contactService";

export function ContactForm() {
  const { user, profile, isAuthenticated } = useAuth();
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
      name: "",
      email: "",
      category: undefined,
      subject: "",
      message: "",
      website_hp: "",
    },
    mode: "onBlur",
  });

  const messageValue = watch("message") || "";

  // Auto-fill user profile info if logged in
  useEffect(() => {
    if (user || profile) {
      const defaultName =
        user?.name ||
        [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
      const defaultEmail = user?.email || profile?.email || "";

      if (defaultName) {
        setValue("name", defaultName, { shouldValidate: false });
      }
      if (defaultEmail) {
        setValue("email", defaultEmail, { shouldValidate: false });
      }
    }
  }, [user, profile, setValue]);

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

    // Spam honeypot trap: if bot filled this hidden field, fake success and return early
    if (values.website_hp && values.website_hp.length > 0) {
      setIsSuccess(true);
      return;
    }

    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;
    let attachmentSize: number | null = null;

    // 1. Upload attachment if attached
    if (attachment.file) {
      const uploadRes = await uploadContactAttachment(attachment.file, {
        isAnonymous: !isAuthenticated,
      });

      if (!uploadRes.success) {
        setSubmitError(uploadRes.error || "Failed to upload attachment. Please try again.");
        return;
      }

      attachmentUrl = uploadRes.path;
      attachmentName = uploadRes.name;
      attachmentSize = uploadRes.size;
    }

    // 2. Submit Contact Request to database service
    const createRes = await createContactRequest({
      name: values.name,
      email: values.email,
      category: values.category,
      subject: values.subject,
      message: values.message,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
      attachment_size: attachmentSize,
    });

    if (!createRes.success) {
      setSubmitError(
        createRes.error ||
          "We couldn't send your message right now. Please check your connection and try again.",
      );
      return;
    }

    // 3. Mark success
    toast.success("Your message has been sent successfully.");
    setIsSuccess(true);
  };

  const handleResetForm = () => {
    reset();
    removeAttachment();
    setSubmitError(null);
    setIsSuccess(false);

    // Re-fill authenticated user details
    if (user || profile) {
      const defaultName =
        user?.name ||
        [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
      const defaultEmail = user?.email || profile?.email || "";
      if (defaultName) setValue("name", defaultName);
      if (defaultEmail) setValue("email", defaultEmail);
    }
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
          Message Sent Successfully
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
          Thank you for contacting SAP Jobs Finder. We&apos;ve received your message and our support
          team will review it promptly.
        </p>

        <p className="mx-auto mt-2 max-w-md text-xs text-muted leading-relaxed">
          We&apos;ll reach out using the email address you provided if we need to follow up.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-surface border border-border px-5 py-3 text-sm font-semibold text-text hover:border-primary/40 hover:bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            <span>Back to Home</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>

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
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-text sm:text-2xl">
          Send Us a Message
        </h2>
        <p className="mt-1 text-sm text-muted">
          Fill in the details below and we&apos;ll get back to you as soon as possible.
        </p>
      </div>

      {submitError ? (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" aria-hidden="true" />
          <div>
            <p className="font-semibold">Unable to send message</p>
            <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{submitError}</p>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Anti-spam honeypot (invisible to real users) */}
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

        {/* Row 1: Name & Email */}
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
              placeholder="e.g. Rahul Sharma"
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

          {/* Email Field */}
          <div>
            <label htmlFor={emailId} className="block text-sm font-medium text-text">
              Email <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id={emailId}
              type="email"
              autoComplete="email"
              placeholder="e.g. rahul@example.com"
              aria-required="true"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? `${emailId}-error` : undefined}
              className={`mt-1.5 w-full rounded-[var(--radius-control)] border bg-background px-4 py-2.5 text-sm text-text outline-none transition-all placeholder:text-muted/60 ${
                errors.email
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-400/20"
                  : "border-border hover:border-muted/80 focus:border-primary focus:ring-2 focus:ring-primary/20"
              }`}
              {...register("email")}
            />
            {errors.email ? (
              <p
                id={`${emailId}-error`}
                role="alert"
                className="mt-1.5 text-xs font-medium text-red-500"
              >
                {errors.email.message}
              </p>
            ) : null}
          </div>
        </div>

        {/* Row 2: Category Selector */}
        <div>
          <label htmlFor={categoryId} className="block text-sm font-medium text-text">
            How can we help? <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <div className="relative mt-1.5">
            <select
              id={categoryId}
              defaultValue=""
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
                Select a topic…
              </option>
              {CONTACT_REQUEST_CATEGORIES.map((cat) => (
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
            placeholder="Brief summary of your inquiry"
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

        {/* Row 4: Message Field with Character Counter */}
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
            placeholder="Please provide details about your inquiry or request…"
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
                Click to browse or drag and drop
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

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="relative inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-8 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                <span>Sending…</span>
              </>
            ) : (
              <>
                <Send size={16} aria-hidden="true" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
