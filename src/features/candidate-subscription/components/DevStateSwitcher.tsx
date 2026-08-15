"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Code2, RefreshCw } from "lucide-react";
import { MOCK_PRESETS } from "../services/candidateSubscriptionService";
import { useCandidateSubscription } from "../context/CandidateSubscriptionProvider";

export function DevStateSwitcher() {
  const [expanded, setExpanded] = useState(false);
  const { applyMockPreset, toggleSimulateError, isSimulatingError } = useCandidateSubscription();

  return (
    <aside
      aria-label="Developer Mock State Controls"
      className="mt-8 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-xs"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between font-semibold text-primary focus-visible:outline-none"
      >
        <span className="flex items-center gap-2">
          <Code2 size={15} aria-hidden="true" />
          <span>Dev Mock States Switcher (Sprint 6E UI Testing)</span>
        </span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-primary/20 space-y-3">
          <p className="text-muted text-[11px]">
            Test how the Candidate Subscriptions UI behaves across different mock account states:
          </p>

          <div className="flex flex-wrap gap-2">
            {Object.entries(MOCK_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => void applyMockPreset(key)}
                className="rounded-lg border border-primary/30 bg-card px-2.5 py-1.5 text-xs font-medium text-text hover:bg-primary/10 transition"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer text-text text-xs">
              <input
                type="checkbox"
                checked={isSimulatingError}
                onChange={(e) => toggleSimulateError(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary/20"
              />
              <span>Simulate API Error</span>
            </label>
          </div>
        </div>
      )}
    </aside>
  );
}
