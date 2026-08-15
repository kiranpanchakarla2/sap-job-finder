"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  History,
  Loader2,
  Lock,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";
import { resolveEmployerMembership } from "@/features/employer-auth/services/employerMembershipService";
import { canBulkUploadJobs } from "@/lib/auth/employerPermissions";
import { useEmployerSubscription } from "@/features/employer-subscription/hooks/useEmployerSubscription";
import { canUseFeature } from "@/features/employer-subscription/config/planRules";
import { EMPLOYER_SUBSCRIPTION_ROUTES } from "@/features/employer-subscription/config/routes";
import { BulkUploadStepIndicator } from "../components/BulkUploadStepIndicator";
import { ExcelTemplateCard } from "../components/ExcelTemplateCard";
import { ExcelFileDropzone } from "../components/ExcelFileDropzone";
import { SelectedExcelFileCard } from "../components/SelectedExcelFileCard";
import { BulkJobImportPreview } from "../components/BulkJobImportPreview";
import { BulkJobImportResultView } from "../components/BulkJobImportResultView";
import { parseExcelWorkbook } from "../lib/excelParser";
import { validateBulkJobRows } from "../lib/bulkJobValidator";
import { jobService } from "../services/jobService";
import { EMPLOYER_JOB_ROUTES } from "../constants";
import type {
  BulkImportResult,
  BulkJobFileValidationResult,
  BulkJobValidationRow,
} from "../types/bulkUpload.types";

export function BulkJobUploadPage() {
  const { data: subscription, isLoading: loadingSubscription } = useEmployerSubscription();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [validationResult, setValidationResult] =
    useState<BulkJobFileValidationResult | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await resolveEmployerMembership();
        if (!active) return;
        if (result.status === "active") {
          setHasPermission(
            canBulkUploadJobs({
              role: result.membership.role,
              canBulkUpload: result.membership.canBulkUpload,
            })
          );
        } else {
          setHasPermission(false);
        }
      } catch {
        if (active) setHasPermission(false);
      } finally {
        if (active) setCheckingAuth(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const processFile = async (file: File) => {
    setIsParsing(true);
    setCurrentStep(2);
    setImportError(null);
    setImportResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const parseRes = await parseExcelWorkbook(buffer);

      const valRes = validateBulkJobRows(
        file.name,
        file.size,
        parseRes.rows,
        parseRes.fileErrors,
        parseRes.fileWarnings,
        {
          isUnsupportedTemplate: parseRes.isUnsupportedTemplate,
          isExceedsMaxRows: parseRes.isExceedsMaxRows,
          isEmptyFile: parseRes.isEmptyFile,
        }
      );

      startTransition(() => {
        setValidationResult(valRes);
        if (valRes.fileErrors.length === 0 && valRes.totalRows > 0) {
          setCurrentStep(3);
        } else {
          setCurrentStep(2);
        }
      });
    } catch {
      setValidationResult({
        fileName: file.name,
        fileSize: file.size,
        totalRows: 0,
        validCount: 0,
        warningCount: 0,
        errorCount: 0,
        fileErrors: [
          "We couldn't read this Excel file. Please check that it is a valid XLS or XLSX file.",
        ],
        fileWarnings: [],
        rows: [],
      });
      setCurrentStep(2);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    void processFile(file);
  };

  const handleStartOver = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setCurrentStep(1);
    setIsImporting(false);
    setImportError(null);
    setImportResult(null);
  };

  const handleBackToUpload = () => {
    setCurrentStep(1);
    setImportError(null);
  };

  // Sprint 7D/7E: Transactional Supabase import execution with persistence & metadata
  const handleConfirmedImport = async (approvedRows: BulkJobValidationRow[]) => {
    setIsImporting(true);
    setImportError(null);

    const metadata = {
      fileName: selectedFile?.name || "Bulk_Jobs_Upload.xlsx",
      fileSize: selectedFile?.size || null,
      fileType:
        selectedFile?.type ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      totalRows: validationResult?.totalRows || approvedRows.length,
    };

    try {
      const res = await jobService.bulkImportJobs(approvedRows, metadata);
      if (!res.success) {
        setImportError(res.error);
        return;
      }
      setImportResult(res.data);
    } catch (err) {
      setImportError(
        "An unexpected error occurred while communicating with the server. Please try again."
      );
    } finally {
      setIsImporting(false);
    }
  };

  if (checkingAuth || loadingSubscription) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-64" />
        <SkeletonCard className="h-44" />
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  if (subscription && !canUseFeature(subscription.planId, "bulk_upload")) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-12">
        <div className="flex items-center gap-2">
          <Link
            href={EMPLOYER_JOB_ROUTES.list}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Jobs
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 via-card to-card p-8 sm:p-10 shadow-soft">
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5 shadow-xs">
              <FileSpreadsheet size={32} aria-hidden="true" />
            </div>

            <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles size={13} aria-hidden="true" />
              Pro & Business Feature
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-text sm:text-3xl">
              Excel Bulk Job Upload
            </h1>
            <p className="mt-3 text-sm text-muted leading-relaxed sm:text-base">
              Bulk Job Upload is available exclusively on Pro and Business plans. Upgrade your subscription to import up to 1,000 jobs in seconds with automated SAP validation, duplicate detection, and batch audit tracking.
            </p>

            <div className="mt-8 rounded-xl border border-border/80 bg-background/50 p-5 text-left">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                What you get with Bulk Upload:
              </h3>
              <ul className="mt-3 space-y-2.5 text-sm text-text">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
                  <span><strong>Import up to 1,000 jobs</strong> in a single formatted Excel spreadsheet</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
                  <span><strong>Automated SAP normalization</strong> & intelligent duplicate detection</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
                  <span><strong>Interactive Review & Preview</strong> with error exclusion & warning acknowledgements</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
                  <span><strong>Import Audit History</strong> with row-level error reports & downloadable logs</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
              <Button href={EMPLOYER_SUBSCRIPTION_ROUTES.subscription} size="lg">
                <Sparkles size={16} className="mr-2" />
                Upgrade to Pro (₹1,999/mo)
              </Button>
              <Button href={EMPLOYER_JOB_ROUTES.list} variant="secondary" size="lg">
                Back to Jobs
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-error/10 text-error">
          <Lock size={28} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-text sm:text-2xl">
          Access Restricted
        </h1>
        <p className="mt-2 text-sm text-muted">
          You do not have permission to bulk upload jobs for this company. Please contact your company administrator.
        </p>
        <div className="mt-6">
          <Button href={EMPLOYER_JOB_ROUTES.list} variant="secondary">
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  const hasFileErrors =
    validationResult && validationResult.fileErrors.length > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={EMPLOYER_JOB_ROUTES.list}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Jobs
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Bulk Upload Jobs
          </h1>
          <p className="mt-1 text-sm text-muted">
            Upload multiple SAP job openings using our Excel template.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" href={EMPLOYER_JOB_ROUTES.bulkUploadHistory}>
            <History size={16} aria-hidden="true" />
            View Upload History
          </Button>
        </div>
      </div>

      {/* Visual Flow Indicator */}
      <BulkUploadStepIndicator
        currentStep={importResult ? 3 : currentStep}
        fileSelected={Boolean(selectedFile)}
      />

      {/* Server Error Alert Banner */}
      {importError && (
        <div
          role="alert"
          className="flex items-start gap-3.5 rounded-2xl border border-error/30 bg-error/10 p-4 text-error shadow-soft sm:p-5"
        >
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-error" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-error">Import Failed</h3>
            <p className="mt-0.5 text-xs text-error/90">{importError}</p>
          </div>
          <button
            type="button"
            onClick={() => setImportError(null)}
            className="text-xs font-semibold text-error/80 hover:text-error underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STAGE 1: Download Template & Upload File */}
      {currentStep === 1 && !importResult && (
        <div className="space-y-6">
          <ExcelTemplateCard />

          {selectedFile ? (
            <SelectedExcelFileCard
              file={selectedFile}
              onReplaceFile={handleFileSelected}
              onRemoveFile={handleStartOver}
              disabled={isParsing}
            />
          ) : (
            <ExcelFileDropzone onFileSelected={handleFileSelected} />
          )}
        </div>
      )}

      {/* STAGE 2: Parsing & File Error State */}
      {currentStep === 2 && !importResult && (
        <div className="space-y-6">
          {isParsing ? (
            <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-border bg-card p-10 text-center shadow-soft">
              <Loader2 size={32} className="animate-spin text-primary" />
              <h3 className="mt-3 text-sm font-semibold text-text">
                Reading and Validating Spreadsheet...
              </h3>
              <p className="mt-1 text-xs text-muted">
                Checking headers, row data, SAP modules, and experience constraints.
              </p>
            </div>
          ) : hasFileErrors ? (
            <div className="space-y-6">
              {validationResult?.isUnsupportedTemplate ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-900 dark:text-amber-200 shadow-soft"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      <FileSpreadsheet size={24} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-amber-950 dark:text-amber-100">
                        Unsupported Excel Template
                      </h3>
                      <p className="mt-1.5 text-sm text-amber-900/90 dark:text-amber-200/90">
                        This file does not match the current SAP Jobs Finder bulk upload template. Please download the latest template and try again.
                      </p>
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <a
                          href="/templates/SAP_Jobs_Finder_Bulk_Job_Template.xlsx"
                          download="SAP_Jobs_Finder_Bulk_Job_Template.xlsx"
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-primary/90"
                        >
                          <FileSpreadsheet size={16} aria-hidden="true" />
                          Download Latest Template
                        </a>
                        <Button
                          variant="secondary"
                          onClick={handleStartOver}
                        >
                          <RotateCcw size={14} className="mr-1.5" />
                          Upload Another File
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : validationResult?.isEmptyFile ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/20 text-muted">
                    <FileSpreadsheet size={24} aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-text">
                    No jobs found
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    The uploaded Excel file does not contain any job records.
                  </p>
                  <div className="mt-5 flex justify-center">
                    <Button
                      variant="primary"
                      onClick={handleStartOver}
                    >
                      <RotateCcw size={14} className="mr-1.5" />
                      Upload Another File
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  role="alert"
                  className="rounded-[var(--radius-card)] border border-error/30 bg-error/10 p-5 text-error shadow-soft"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error/20 text-error">
                      <XCircle size={22} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-error">
                        Spreadsheet Structure Issues Detected
                      </h3>
                      <p className="mt-1 text-xs text-error/90">
                        We couldn&apos;t proceed with validation due to header or structure issues in{" "}
                        <span className="font-semibold">{validationResult?.fileName}</span>:
                      </p>
                      <ul className="mt-3 list-inside list-disc space-y-1.5 text-xs text-error/90">
                        {validationResult?.fileErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {!validationResult?.isUnsupportedTemplate && !validationResult?.isEmptyFile && (
                <div className="flex flex-col-reverse gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    variant="secondary"
                    onClick={handleBackToUpload}
                    className="w-full sm:w-auto"
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                    Back to Upload
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleStartOver}
                    className="w-full sm:w-auto"
                  >
                    <RotateCcw size={14} className="mr-1.5" />
                    Upload Another File
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* STAGE 3: Review & Confirm Preview */}
      {currentStep === 3 && validationResult && !importResult && (
        <BulkJobImportPreview
          validationResult={validationResult}
          isImporting={isImporting}
          onBack={handleBackToUpload}
          onStartOver={handleStartOver}
          onConfirmImport={handleConfirmedImport}
        />
      )}

      {/* STAGE 4: Final Import Result Outcome */}
      {importResult && (
        <BulkJobImportResultView
          result={importResult}
          fileName={selectedFile?.name ?? validationResult?.fileName ?? "Excel Upload"}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}

