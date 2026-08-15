"use client";

import { useRef, type ChangeEvent } from "react";
import { CheckCircle2, FileSpreadsheet, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  ALLOWED_EXCEL_EXTENSIONS,
  BULK_UPLOAD_MAX_FILE_SIZE_BYTES,
  BULK_UPLOAD_MAX_FILE_SIZE_LABEL,
} from "../constants";
import { toast } from "sonner";

interface SelectedExcelFileCardProps {
  file: File;
  onReplaceFile: (newFile: File) => void;
  onRemoveFile: () => void;
  disabled?: boolean;
}

export function SelectedExcelFileCard({
  file,
  onReplaceFile,
  onRemoveFile,
  disabled = false,
}: SelectedExcelFileCardProps) {
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileTypeLabel = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toUpperCase();
    return ext ? ext : "EXCEL";
  };

  const handleReplaceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selected = files[0];
      const nameLower = selected.name.toLowerCase();
      const isValidExt = ALLOWED_EXCEL_EXTENSIONS.some((ext) =>
        nameLower.endsWith(ext)
      );

      if (!isValidExt) {
        toast.error("Unsupported file format. Please upload an XLS or XLSX file.");
        return;
      }

      if (selected.size > BULK_UPLOAD_MAX_FILE_SIZE_BYTES) {
        toast.error(
          `This file is larger than ${BULK_UPLOAD_MAX_FILE_SIZE_LABEL}. Please upload a smaller Excel file.`
        );
        return;
      }

      onReplaceFile(selected);
      toast.success("File replaced successfully.");
    }
    if (replaceInputRef.current) {
      replaceInputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft sm:p-7">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
            Step 2: Completed
          </span>
          <h2 className="text-lg font-bold tracking-tight text-text sm:text-xl">
            Selected Excel File
          </h2>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success border border-success/20">
          <CheckCircle2 size={14} aria-hidden="true" />
          Excel file ready
        </div>
      </div>

      <input
        ref={replaceInputRef}
        type="file"
        id="excel-replace-file-input"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        onChange={handleReplaceChange}
        disabled={disabled}
        className="sr-only"
        aria-label="Replace Excel file"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <FileSpreadsheet size={28} aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-bold text-text truncate max-w-sm sm:max-w-md md:max-w-lg"
              title={file.name}
            >
              {file.name}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted">
              <span>{formatFileSize(file.size)}</span>
              <span>•</span>
              <span className="font-semibold text-primary">
                {getFileTypeLabel(file.name)}
              </span>
              <span>•</span>
              <span className="text-muted/80">Client-side verified</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
          <Button
            type="button"
            variant="secondary"
            onClick={() => replaceInputRef.current?.click()}
            disabled={disabled}
            className="px-3 py-2 text-xs"
            aria-label="Replace selected Excel file"
          >
            <RefreshCw size={14} aria-hidden="true" />
            Replace
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onRemoveFile}
            disabled={disabled}
            className="px-3 py-2 text-xs text-error hover:text-error hover:bg-error/10"
            aria-label="Remove selected Excel file"
          >
            <Trash2 size={14} aria-hidden="true" />
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
