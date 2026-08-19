"use client";

import { memo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Info,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import type {
  AdminEmployerPlan,
  DurationUnit,
  EmployerPlanFormData,
  PlanCurrency,
} from "../../types/plan.types";
import {
  EMPLOYER_DEFAULT_BULLETS,
  EMPLOYER_FEATURE_OPTIONS,
} from "../../constants/employerFeatures";

type EmployerPlanFormProps = {
  initialPlan?: AdminEmployerPlan | null;
  isCreate?: boolean;
  isSubmitting: boolean;
  onSubmit: (data: EmployerPlanFormData) => Promise<void>;
};

export const EmployerPlanForm = memo(function EmployerPlanForm({
  initialPlan,
  isCreate = false,
  isSubmitting,
  onSubmit,
}: EmployerPlanFormProps) {
  // Form state
  const [id, setId] = useState(initialPlan?.id || "");
  const [name, setName] = useState(initialPlan?.name || "");
  const [tagline, setTagline] = useState(initialPlan?.tagline || "");
  const [description, setDescription] = useState(initialPlan?.description || "");
  const [priceMonthly, setPriceMonthly] = useState<number | string>(
    initialPlan ? initialPlan.priceMonthly : 1999,
  );
  const [priceQuarterly, setPriceQuarterly] = useState<number | string>(
    initialPlan ? initialPlan.priceQuarterly : 5399,
  );
  const [priceYearly, setPriceYearly] = useState<number | string>(
    initialPlan ? initialPlan.priceYearly : 19199,
  );
  const [currency, setCurrency] = useState<PlanCurrency>(
    initialPlan?.currency || "INR",
  );
  const [durationValue, setDurationValue] = useState<number>(
    initialPlan?.durationValue ?? 1,
  );
  const [durationUnit, setDurationUnit] = useState<DurationUnit>(
    initialPlan?.durationUnit || "months",
  );
  const [isActive, setIsActive] = useState<boolean>(
    initialPlan ? initialPlan.isActive : true,
  );
  const [badge, setBadge] = useState<string>(initialPlan?.badge || "");
  const [highlighted, setHighlighted] = useState<boolean>(
    initialPlan?.highlighted ?? false,
  );
  const [sortOrder, setSortOrder] = useState<number>(
    initialPlan?.sortOrder ?? 1,
  );

  // Employer Limits state
  const [unlimitedActiveJobs, setUnlimitedActiveJobs] = useState<boolean>(
    initialPlan ? initialPlan.limits.activeJobs === null : false,
  );
  const [activeJobs, setActiveJobs] = useState<number | string>(
    initialPlan && initialPlan.limits.activeJobs !== null
      ? initialPlan.limits.activeJobs
      : 25,
  );

  const [unlimitedApplications, setUnlimitedApplications] = useState<boolean>(
    initialPlan ? initialPlan.limits.applications === null : false,
  );
  const [applications, setApplications] = useState<number | string>(
    initialPlan && initialPlan.limits.applications !== null
      ? initialPlan.limits.applications
      : 500,
  );

  const [unlimitedTalentSearch, setUnlimitedTalentSearch] = useState<boolean>(
    initialPlan ? initialPlan.limits.talentSearch === null : false,
  );
  const [talentSearch, setTalentSearch] = useState<number | string>(
    initialPlan && initialPlan.limits.talentSearch !== null
      ? initialPlan.limits.talentSearch
      : 100,
  );

  const [unlimitedTeamMembers, setUnlimitedTeamMembers] = useState<boolean>(
    initialPlan ? initialPlan.limits.teamMembers === null : false,
  );
  const [teamMembers, setTeamMembers] = useState<number | string>(
    initialPlan && initialPlan.limits.teamMembers !== null
      ? initialPlan.limits.teamMembers
      : 5,
  );

  // Feature Flags
  const [featureFlags, setFeatureFlags] = useState<string[]>(
    initialPlan?.featureFlags || [
      "basic_analytics",
      "advanced_analytics",
      "talent_search",
      "candidate_messaging",
      "interview_management",
      "bulk_upload",
    ],
  );

  // Bullets
  const [features, setFeatures] = useState<string[]>(
    initialPlan?.features && initialPlan.features.length > 0
      ? initialPlan.features
      : [
          "25 active jobs",
          "Bulk Job Upload (Excel)",
          "Talent Search & Discovery (100 views)",
          "Team Management (5 seats)",
          "Advanced Analytics",
          "Interview scheduling & scorecards",
        ],
  );
  const [newBullet, setNewBullet] = useState("");

  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Slug generator
  const handleNameChange = (val: string) => {
    setName(val);
    if (isCreate) {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setId(slug);
    }
  };

  const handleAddBullet = () => {
    if (!newBullet.trim()) return;
    setFeatures((prev) => [...prev, newBullet.trim()]);
    setNewBullet("");
  };

  const handleRemoveBullet = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleFeatureFlag = (key: string) => {
    setFeatureFlags((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleLoadBulletsPreset = (presetKey: string) => {
    const bullets = EMPLOYER_DEFAULT_BULLETS[presetKey];
    if (bullets) {
      setFeatures(bullets);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);

    // Validation
    if (!name.trim()) {
      setErrorBanner("Plan Name is required.");
      return;
    }
    if (isCreate && !id.trim()) {
      setErrorBanner("Plan ID/Slug is required.");
      return;
    }
    if (priceMonthly === "" || isNaN(Number(priceMonthly)) || Number(priceMonthly) < 0) {
      setErrorBanner("Monthly price must be a valid number >= 0.");
      return;
    }

    const payload: EmployerPlanFormData = {
      id: isCreate ? id.trim().toLowerCase() : initialPlan!.id,
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      priceMonthly: Number(priceMonthly),
      priceQuarterly: Number(priceQuarterly || Number(priceMonthly) * 3),
      priceYearly: Number(priceYearly || Number(priceMonthly) * 12),
      currency,
      durationValue: Number(durationValue || 1),
      durationUnit,
      isActive,
      badge: badge.trim(),
      highlighted,
      features: features.map((f) => f.trim()).filter(Boolean),
      featureFlags,
      limits: {
        activeJobs: unlimitedActiveJobs ? null : Number(activeJobs || 0),
        applications: unlimitedApplications ? null : Number(applications || 0),
        talentSearch: unlimitedTalentSearch ? null : Number(talentSearch || 0),
        teamMembers: unlimitedTeamMembers ? null : Number(teamMembers || 0),
      },
      sortOrder: Number(sortOrder || 0),
    };

    try {
      await onSubmit(payload);
    } catch (err: unknown) {
      setErrorBanner(err instanceof Error ? err.message : "Failed to save plan");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl pb-16">
      {/* Header Back & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/admin/subscriptions/employer-plans"
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Employer Plans
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/subscriptions/employer-plans"
            className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-hover hover:text-text transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-soft transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Plan...
              </>
            ) : isCreate ? (
              "Create Employer Plan"
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>

      {errorBanner && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium flex items-center gap-3">
          <Info className="h-5 w-5 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Section 1: Basic Information */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <div className="border-b border-border pb-3">
          <h2 className="text-base font-bold text-text">Employer Tier Identity & Description</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Define plan branding and recruiter-facing details.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Plan Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Pro, Business, Enterprise"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-hover/50 border border-border text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Plan Identifier / Slug <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!isCreate}
              value={id}
              onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              placeholder="e.g. pro, business"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-hover/50 border border-border text-sm font-mono text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {isCreate ? (
              <p className="text-[11px] text-text-muted mt-1.5">
                Lowercase alphanumeric identifier used in database references.
              </p>
            ) : (
              <p className="text-[11px] text-text-muted mt-1.5">
                Immutable identifier to safeguard historical subscription integrity.
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Scale hiring with advanced insights and Talent Search."
              className="w-full px-4 py-2.5 rounded-xl bg-surface-hover/50 border border-border text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Detailed Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Unlimited hiring capacity for growing teams and direct talent search."
              className="w-full px-4 py-2.5 rounded-xl bg-surface-hover/50 border border-border text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Pricing & Duration */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <div className="border-b border-border pb-3">
          <h2 className="text-base font-bold text-text">Employer Pricing & Duration</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Configure tiered pricing options for employer recruitment subscriptions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Monthly Price <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted">
                {currency === "INR" ? "₹" : "$"}
              </span>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={priceMonthly}
                onChange={(e) => {
                  const val = e.target.value === "" ? "" : Number(e.target.value);
                  setPriceMonthly(val);
                  if (typeof val === "number") {
                    setPriceQuarterly(Math.round(val * 3 * 0.9));
                    setPriceYearly(Math.round(val * 12 * 0.8));
                  }
                }}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-surface-hover/50 border border-border text-sm text-text font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <span className="text-[11px] text-text-muted mt-1 block">Set 0 for free tiers.</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Quarterly Price (3 mo)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted">
                {currency === "INR" ? "₹" : "$"}
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={priceQuarterly}
                onChange={(e) => setPriceQuarterly(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-surface-hover/50 border border-border text-sm text-text font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Yearly Price (12 mo)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted">
                {currency === "INR" ? "₹" : "$"}
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={priceYearly}
                onChange={(e) => setPriceYearly(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-surface-hover/50 border border-border text-sm text-text font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Currency <span className="text-rose-500">*</span>
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as PlanCurrency)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-hover/50 border border-border text-sm text-text font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="INR">INR (₹ - Indian Rupee)</option>
              <option value="USD">USD ($ - US Dollar)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Duration Value
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={durationValue}
              onChange={(e) => setDurationValue(Math.max(1, Number(e.target.value)))}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-hover/50 border border-border text-sm text-text font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Duration Unit
            </label>
            <select
              value={durationUnit}
              onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-hover/50 border border-border text-sm text-text font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="months">Months</option>
              <option value="days">Days</option>
              <option value="years">Years</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Employer Recruitment Limits */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <div className="border-b border-border pb-3">
          <h2 className="text-base font-bold text-text">Recruitment & Pipeline Limits</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Configure job posting caps, talent search view quotas, and team seat limits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Active Job Limit */}
          <div className="rounded-xl border border-border/80 bg-surface-hover/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text uppercase tracking-wider">
                Active Job Postings Cap
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text-secondary">
                <input
                  type="checkbox"
                  checked={unlimitedActiveJobs}
                  onChange={(e) => setUnlimitedActiveJobs(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                Unlimited
              </label>
            </div>
            {!unlimitedActiveJobs ? (
              <input
                type="number"
                min="0"
                value={activeJobs}
                onChange={(e) => setActiveJobs(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm text-text font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            ) : (
              <div className="px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                ✓ Unlimited Active Job Postings
              </div>
            )}
          </div>

          {/* Applications Limit */}
          <div className="rounded-xl border border-border/80 bg-surface-hover/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text uppercase tracking-wider">
                Total Applications Capacity
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text-secondary">
                <input
                  type="checkbox"
                  checked={unlimitedApplications}
                  onChange={(e) => setUnlimitedApplications(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                Unlimited
              </label>
            </div>
            {!unlimitedApplications ? (
              <input
                type="number"
                min="0"
                value={applications}
                onChange={(e) => setApplications(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm text-text font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            ) : (
              <div className="px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                ✓ Unlimited Candidate Applications
              </div>
            )}
          </div>

          {/* Talent Search Limit */}
          <div className="rounded-xl border border-border/80 bg-surface-hover/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text uppercase tracking-wider">
                Talent Search Views / Quota
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text-secondary">
                <input
                  type="checkbox"
                  checked={unlimitedTalentSearch}
                  onChange={(e) => setUnlimitedTalentSearch(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                Unlimited
              </label>
            </div>
            {!unlimitedTalentSearch ? (
              <input
                type="number"
                min="0"
                value={talentSearch}
                onChange={(e) => setTalentSearch(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm text-text font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            ) : (
              <div className="px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                ✓ Unlimited Talent Search & Profile Views
              </div>
            )}
          </div>

          {/* Team Members Limit */}
          <div className="rounded-xl border border-border/80 bg-surface-hover/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text uppercase tracking-wider">
                Team Member Seats
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text-secondary">
                <input
                  type="checkbox"
                  checked={unlimitedTeamMembers}
                  onChange={(e) => setUnlimitedTeamMembers(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                Unlimited
              </label>
            </div>
            {!unlimitedTeamMembers ? (
              <input
                type="number"
                min="0"
                value={teamMembers}
                onChange={(e) => setTeamMembers(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm text-text font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            ) : (
              <div className="px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                ✓ Unlimited Team Member Seats
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: System Capability Flags */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <div className="border-b border-border pb-3">
          <h2 className="text-base font-bold text-text">Employer Recruitment Capabilities</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Select recruitment modules and tools unlocked for employers subscribing to this tier.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {EMPLOYER_FEATURE_OPTIONS.map((feat) => {
            const isChecked = featureFlags.includes(feat.key);
            return (
              <label
                key={feat.key}
                onClick={() => handleToggleFeatureFlag(feat.key)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isChecked
                    ? "border-primary/40 bg-primary/5 text-text"
                    : "border-border bg-surface-hover/30 text-text-secondary hover:border-border-hover"
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border mt-0.5 transition-colors ${
                    isChecked
                      ? "bg-primary border-primary text-white"
                      : "border-border bg-surface"
                  }`}
                >
                  {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold block text-text">{feat.label}</span>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Section 5: Display Bullets (Employer-Facing) */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="text-base font-bold text-text">Employer-Facing Feature Bullets</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Bullet points displayed in the Employer subscription comparison interface.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span>Presets:</span>
            <button
              type="button"
              onClick={() => handleLoadBulletsPreset("free")}
              className="px-2 py-1 rounded-md bg-surface-hover hover:text-text font-medium"
            >
              Free
            </button>
            <button
              type="button"
              onClick={() => handleLoadBulletsPreset("pro")}
              className="px-2 py-1 rounded-md bg-surface-hover hover:text-text font-medium"
            >
              Pro
            </button>
            <button
              type="button"
              onClick={() => handleLoadBulletsPreset("business")}
              className="px-2 py-1 rounded-md bg-surface-hover hover:text-text font-medium"
            >
              Business
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {features.map((bullet, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-hover/40 border border-border/70 group"
            >
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <input
                type="text"
                value={bullet}
                onChange={(e) => {
                  const updated = [...features];
                  updated[idx] = e.target.value;
                  setFeatures(updated);
                }}
                className="flex-1 bg-transparent text-xs font-semibold text-text focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemoveBullet(idx)}
                className="text-text-muted hover:text-rose-500 p-1 opacity-60 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newBullet}
              onChange={(e) => setNewBullet(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddBullet();
                }
              }}
              placeholder="Add another highlight bullet..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-surface-hover/50 border border-border text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button
              type="button"
              onClick={handleAddBullet}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-hover hover:bg-surface-hover/80 text-xs font-bold text-text border border-border cursor-pointer transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Section 6: Display & Status Settings */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <div className="border-b border-border pb-3">
          <h2 className="text-base font-bold text-text">Display & Status Settings</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Configure presentation badges, ordering, and active availability.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-center">
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Badge Label
            </label>
            <input
              type="text"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="e.g. Most Popular, Best Value"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-hover/50 border border-border text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Display Order (Priority)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={sortOrder}
              onChange={(e) => setSortOrder(Math.max(0, Number(e.target.value)))}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-hover/50 border border-border text-sm text-text font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <span className="text-[11px] text-text-muted mt-1 block">
              Lower numbers appear first (e.g. 1, 2, 3).
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={highlighted}
                onChange={(e) => setHighlighted(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <span className="text-xs font-bold text-text flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Highlight as Featured Tier
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <span className="text-xs font-bold text-text">
                Active & Available for Purchase
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Footer Submit Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Link
          href="/admin/subscriptions/employer-plans"
          className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-hover hover:text-text transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-soft transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving Plan...
            </>
          ) : isCreate ? (
            "Create Employer Plan"
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
});
