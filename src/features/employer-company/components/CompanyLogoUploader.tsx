"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { companyService } from "../services/companyService";
import type { LogoUploadState } from "../types/company.types";

export function CompanyLogoUploader({
  value,
  onChange,
  employerId,
  disabled = false,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  employerId: string;
  disabled?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<LogoUploadState>(value ? "uploaded" : "idle");
  const [error, setError] = useState<string | null>(null);

  const onPick = async (file: File | undefined) => {
    if (!file || disabled) return;
    setState("uploading");
    setError(null);
    const result = await companyService.uploadLogo(employerId, file);
    if (!result.success) {
      setState("error");
      setError(result.error);
      toast.error(result.error);
      return;
    }
    onChange(result.data);
    setState("uploaded");
    toast.success("Logo uploaded successfully.");
  };

  const onRemove = () => {
    onChange(null);
    setState("idle");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface"
          aria-hidden={Boolean(value)}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="text-muted" size={22} />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-text">Company Logo</p>
          <p className="text-xs text-muted">PNG or JPG up to 2 MB. Square logos work best.</p>
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={disabled || state === "uploading"}
              onChange={(event) => void onPick(event.target.files?.[0])}
            />
            <Button
              type="button"
              variant="secondary"
              className="!px-3 !py-2 text-xs"
              disabled={disabled || state === "uploading"}
              onClick={() => inputRef.current?.click()}
              aria-describedby={error ? `${inputId}-error` : undefined}
            >
              {state === "uploading" ? (
                <>
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  Uploading…
                </>
              ) : value ? (
                <>
                  <Upload size={14} aria-hidden="true" />
                  Replace
                </>
              ) : (
                <>
                  <Upload size={14} aria-hidden="true" />
                  Upload
                </>
              )}
            </Button>
            {value ? (
              <Button
                type="button"
                variant="ghost"
                className="!px-3 !py-2 text-xs text-error hover:text-error"
                disabled={disabled || state === "uploading"}
                onClick={onRemove}
              >
                <Trash2 size={14} aria-hidden="true" />
                Remove
              </Button>
            ) : null}
          </div>
          <label htmlFor={inputId} className="sr-only">
            Upload company logo
          </label>
        </div>
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-error">
          {error}
        </p>
      ) : null}
      {state === "uploaded" && value ? (
        <p className="text-xs text-success" role="status">
          Logo ready
        </p>
      ) : null}
    </div>
  );
}
