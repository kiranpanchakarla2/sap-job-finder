import type { JobFormValues } from "./validation";

const PREVIEW_DRAFT_KEY = "sapjobsfinder-job-preview-draft";

export type PreviewDraftPayload = {
  values: JobFormValues;
  companyName: string;
  logoUrl: string | null;
};

export function savePreviewDraft(payload: PreviewDraftPayload) {
  sessionStorage.setItem(PREVIEW_DRAFT_KEY, JSON.stringify(payload));
}

export function loadPreviewDraft(): PreviewDraftPayload | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PREVIEW_DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PreviewDraftPayload;
  } catch {
    return null;
  }
}

export function clearPreviewDraft() {
  sessionStorage.removeItem(PREVIEW_DRAFT_KEY);
}
