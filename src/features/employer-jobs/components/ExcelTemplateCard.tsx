"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  Info,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  BULK_JOB_TEMPLATE_COLUMNS,
  BULK_JOB_TEMPLATE_FILENAME,
  downloadBulkJobTemplate,
} from "../lib/excelTemplate";

export function ExcelTemplateCard() {
  const [downloading, setDownloading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadBulkJobTemplate();
      toast.success("Excel template downloaded successfully.", {
        description: `Saved as ${BULK_JOB_TEMPLATE_FILENAME}`,
      });
    } catch {
      toast.error("Failed to download template. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileSpreadsheet size={24} aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Step 1
              </span>
              <h2 className="text-lg font-bold tracking-tight text-text sm:text-xl">
                Download Excel Template
              </h2>
            </div>
            <p className="mt-2 text-sm text-muted">
              Use our standard Excel template to upload multiple job openings at once.
            </p>
            <p className="mt-1 text-xs text-muted/80">
              The template contains the required fields and example data.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col sm:flex-row lg:flex-col gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleDownload}
            disabled={downloading}
            className="w-full sm:w-auto"
          >
            <Download size={16} aria-hidden="true" />
            {downloading ? "Generating Template..." : "Download Excel Template"}
          </Button>

          <button
            type="button"
            onClick={() => setShowGuide((prev) => !prev)}
            aria-expanded={showGuide}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-md py-1"
          >
            {showGuide ? (
              <>
                <ChevronUp size={14} aria-hidden="true" />
                Hide Column Specifications
              </>
            ) : (
              <>
                <ChevronDown size={14} aria-hidden="true" />
                View Template Columns ({BULK_JOB_TEMPLATE_COLUMNS.length})
              </>
            )}
          </button>
        </div>
      </div>

      {showGuide ? (
        <div className="mt-6 border-t border-border pt-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text flex items-center gap-1.5">
              <Info size={16} className="text-primary" />
              Template Column Specifications ({BULK_JOB_TEMPLATE_COLUMNS.length} Columns)
            </h3>
            <span className="text-xs text-muted">
              Columns must remain in this exact order
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-card text-muted">
                <tr>
                  <th scope="col" className="px-3.5 py-2.5 font-semibold">
                    #
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 font-semibold">
                    Column Header
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 font-semibold">
                    Required
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 font-semibold">
                    Expected Format / Notes
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 font-semibold">
                    Example Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {BULK_JOB_TEMPLATE_COLUMNS.map((col, index) => (
                  <tr
                    key={col.key}
                    className="hover:bg-card/50 transition-colors"
                  >
                    <td className="px-3.5 py-2 text-muted font-mono">
                      {index + 1}
                    </td>
                    <td className="px-3.5 py-2 font-semibold text-text">
                      {col.header}
                    </td>
                    <td className="px-3.5 py-2">
                      {col.required ? (
                        <span className="rounded bg-error/10 px-1.5 py-0.5 text-[11px] font-semibold text-error">
                          Required
                        </span>
                      ) : (
                        <span className="rounded bg-muted/10 px-1.5 py-0.5 text-[11px] font-medium text-muted">
                          Optional
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2 text-muted">{col.description}</td>
                    <td className="px-3.5 py-2 font-mono text-[11px] text-text/80">
                      {String(col.example)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-text">
            <ShieldCheck size={16} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-primary">
                Important Data Ownership Rule
              </p>
              <p className="mt-0.5 text-muted">
                Company ID, Employer ID, and Creator identifiers are intentionally omitted from the spreadsheet. All uploaded openings will automatically be bound to your authenticated company workspace.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
