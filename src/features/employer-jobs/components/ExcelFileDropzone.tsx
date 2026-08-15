"use client";

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { AlertCircle, FileSpreadsheet, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  ALLOWED_EXCEL_EXTENSIONS,
  BULK_UPLOAD_MAX_FILE_SIZE_BYTES,
  BULK_UPLOAD_MAX_FILE_SIZE_LABEL,
} from "../constants";

interface ExcelFileDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function ExcelFileDropzone({
  onFileSelected,
  disabled = false,
}: ExcelFileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelectFile = useCallback(
    (file: File) => {
      setErrorMessage(null);

      // Check extension
      const fileNameLower = file.name.toLowerCase();
      const hasValidExtension = ALLOWED_EXCEL_EXTENSIONS.some((ext) =>
        fileNameLower.endsWith(ext)
      );

      if (!hasValidExtension) {
        const errorMsg =
          "Unsupported file format. Please upload an Excel (.xlsx) file.";
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Check file size (10 MB limit)
      if (file.size > BULK_UPLOAD_MAX_FILE_SIZE_BYTES) {
        const errorMsg = `This file is larger than ${BULK_UPLOAD_MAX_FILE_SIZE_LABEL}. Please upload a smaller Excel file.`;
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Valid file
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSelectFile(files[0]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSelectFile(files[0]);
    }
    // Reset the input value so selecting the same file again triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBrowseClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleBrowseClick();
    }
  };

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft sm:p-7">
      <div className="flex items-center gap-2 mb-4">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          Step 2
        </span>
        <h2 className="text-lg font-bold tracking-tight text-text sm:text-xl">
          Upload Excel File
        </h2>
      </div>

      {/* Hidden Accessible File Input */}
      <input
        ref={fileInputRef}
        type="file"
        id="excel-file-input"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handleInputChange}
        disabled={disabled}
        className="sr-only"
        aria-label="Upload Excel spreadsheet file (.xlsx)"
      />

      {/* Interactive Dropzone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label="Excel file drop area. Drag and drop or press Enter to browse files."
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        onKeyDown={handleKeyDown}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all sm:p-10 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
          isDragOver
            ? "border-primary bg-primary/10 scale-[1.008]"
            : "border-border bg-surface hover:border-primary/50 hover:bg-surface/80"
        } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110 ${
            isDragOver
              ? "bg-primary text-white shadow-lift"
              : "bg-primary/10 text-primary"
          }`}
        >
          {isDragOver ? (
            <UploadCloud size={32} aria-hidden="true" />
          ) : (
            <FileSpreadsheet size={32} aria-hidden="true" />
          )}
        </div>

        <h3 className="mt-4 text-base font-semibold text-text">
          {isDragOver
            ? "Drop your Excel spreadsheet here"
            : "Drag & drop your Excel file here"}
        </h3>
        <p className="mt-1 text-sm text-muted">
          or{" "}
          <span className="font-semibold text-primary underline underline-offset-2">
            browse from your computer
          </span>
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleBrowseClick();
            }}
            disabled={disabled}
            className="pointer-events-auto"
          >
            <UploadCloud size={16} aria-hidden="true" />
            Browse Files
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1 font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Supported format: XLSX (.xlsx)
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Maximum file size: {BULK_UPLOAD_MAX_FILE_SIZE_LABEL}
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Capacity: Up to 1,000 jobs per import
          </span>
        </div>
      </div>

      {/* Inline Error State */}
      {errorMessage ? (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-xl border border-error/30 bg-error/10 p-3.5 text-xs text-error"
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Validation Error</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
