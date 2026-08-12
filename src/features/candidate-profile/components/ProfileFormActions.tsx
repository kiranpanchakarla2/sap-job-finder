"use client";

import { Loader2, Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ProfileFormActions({
  editing,
  saving = false,
  onEdit,
  onSave,
  onCancel,
}: {
  editing: boolean;
  saving?: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (!editing) {
    return (
      <Button type="button" variant="primary" onClick={onEdit}>
        <Pencil size={15} aria-hidden="true" />
        Edit Profile
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        onClick={onCancel}
        disabled={saving}
      >
        <X size={15} aria-hidden="true" />
        Cancel
      </Button>
      <Button
        type="button"
        variant="primary"
        onClick={onSave}
        disabled={saving}
      >
        {saving ? (
          <Loader2 size={15} className="animate-spin" aria-hidden="true" />
        ) : (
          <Save size={15} aria-hidden="true" />
        )}
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
