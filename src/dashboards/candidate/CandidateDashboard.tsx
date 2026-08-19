"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  Bookmark,
  Briefcase,
  CreditCard,
  Eye,
  GraduationCap,
  HelpCircle,
  PhoneCall,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { DashboardJobCard } from "@/components/dashboard/shared/JobCard";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { ProgressCard } from "@/components/dashboard/shared/ProgressCard";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import {
  computeApplicationStats,
  formatApplicationDate,
  useApplications,
} from "@/features/candidate-applications";
import { useCandidateProfileCompletion } from "@/features/candidate-profile/hooks/useCandidateProfileCompletion";
import { useCandidateCareer } from "@/features/candidate-resume";
import { useSavedJobs } from "@/features/candidate-jobs";
import { useJobAlerts } from "@/features/candidate-alerts";
import { loadCandidateMatchProfile } from "@/features/candidate-jobs/lib/loadCandidateMatchProfile";
import { formatPostedShort } from "@/features/candidate-jobs/lib/formatPosted";
import { candidateJobService } from "@/features/candidate-jobs/services/candidateJobService";
import { candidateSettingsService } from "@/features/candidate-settings";
import type { TalentHubVisibilityState } from "@/features/candidate-settings";
import { useRouter } from "next/navigation";
import { SubscriptionRenewalBanner } from "@/features/shared-subscription";
import { useCandidateSubscription } from "@/features/candidate-subscription";
import type { RecommendedJob } from "@/types/job";

export function CandidateDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { subscription, currentPlan, pendingPaymentRequest } = useCandidateSubscription();
  const { savedCount, toggleSave } = useSavedJobs();

  const { activeAlertsCount, totalAlertsCount } = useJobAlerts();
  const { applications } = useApplications();
  const { data: careerData } = useCandidateCareer();
  const applicationStats = computeApplicationStats(applications);
  const interviewApplications = applications.filter((app) => app.status === "interview");
  const firstName = user?.name?.split(" ")[0] || "Candidate";
  const { percent: profileCompletion, completion } = useCandidateProfileCompletion();
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([]);
  const [talentHubVisibility, setTalentHubVisibility] =
    useState<TalentHubVisibilityState>("private");

  const resumeScore = careerData?.resumeScore ?? {
    score: profileCompletion,
    label: profileCompletion >= 80 ? "Strong profile" : "In progress",
    tip: "Upload your resume and add SAP skills.",
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Load recommended jobs
      const profile = await loadCandidateMatchProfile();
      const result = await candidateJobService.getRecommendedJobs(profile, 4);
      if (!cancelled && result.success) {
        setRecommendedJobs(
          result.data.map((job) => ({
            id: job.id,
            title: job.title,
            company: job.companyName,
            location: job.location,
            experience: job.experienceLabel,
            sapModule: job.sapModules[0] ?? "SAP",
            salary: job.salaryLabel,
            postedAt: formatPostedShort(job.postedAt),
            workMode: job.workMode === "On-site" ? "Onsite" : job.workMode,
          })),
        );
      }

      // Load Talent Hub privacy setting
      const settingsRes = await candidateSettingsService.getMySettings();
      if (!cancelled && settingsRes.success) {
        setTalentHubVisibility(
          settingsRes.data.privacy.talentHubVisibility ||
            (settingsRes.data.privacy.profileVisibility as TalentHubVisibilityState) ||
            "private",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
              Welcome back, {firstName} 👋
            </h1>
            <Link
              href="/candidate/subscription"
              className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary hover:bg-primary/20 transition"
              title="Manage Candidate Plan"
            >
              <CreditCard size={12} aria-hidden="true" />
              <span>{currentPlan.name} Plan</span>
            </Link>
            <Link
              href="/candidate/settings#privacy"
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition ${
                talentHubVisibility === "open_to_opportunities"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                  : talentHubVisibility === "employer_visible"
                    ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
                    : "border-border bg-surface text-muted hover:bg-card hover:text-text"
              }`}
              title="Talent Hub Visibility Settings"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  talentHubVisibility === "open_to_opportunities"
                    ? "bg-emerald-500"
                    : talentHubVisibility === "employer_visible"
                      ? "bg-primary"
                      : "bg-muted"
                }`}
              />
              <span>
                Talent Hub:{" "}
                {talentHubVisibility === "open_to_opportunities"
                  ? "Open to Opportunities"
                  : talentHubVisibility === "employer_visible"
                    ? "Visible to Employers"
                    : "Private"}
              </span>
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted">
            Continue your SAP Jobs Finder career journey with tailored SAP opportunities.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/candidate/subscription"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-3.5 text-xs font-semibold text-text shadow-soft transition hover:bg-surface focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            Manage Subscription
          </Link>
          <Link
            href="/candidate/profile"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-soft transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            Complete Profile
          </Link>
        </div>
      </div>

      {/* RENEWAL / EXPIRY / PENDING PAYMENT REQUEST BANNER */}
      <SubscriptionRenewalBanner
        accountType="candidate"
        subscription={subscription}
        currentPlanName={currentPlan?.name}
        pendingPaymentRequest={pendingPaymentRequest}
        onRenew={() => router.push("/candidate/subscription")}
      />


      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ProgressCard
            title="Profile Completion"
            description="Add skills and certifications to improve matches."
            progress={profileCompletion}
            href="/candidate/profile"
            ctaLabel="Complete Profile"
            className="h-full"
            breakdown={completion?.categories.map(cat => ({ label: cat.label, complete: cat.complete }))}
          />
        </div>
        <div className="grid gap-4 grid-cols-2 grid-rows-2 lg:col-span-2">
          <Link href="/candidate/applications" className="block h-full">
            <StatCard
              label="Applications"
              value={applicationStats.total}
              icon={Briefcase}
              hint={`${applicationStats.underReview} under review`}
            />
          </Link>
          <Link href="/candidate/saved-jobs" className="block h-full">
            <StatCard
              label="Saved Jobs"
              value={savedCount}
              icon={Bookmark}
              tone="info"
            />
          </Link>
          <Link href="/candidate/job-alerts" className="block h-full">
            <StatCard
              label="Job Alerts"
              value={activeAlertsCount}
              icon={Bell}
              hint={totalAlertsCount > 0 ? `${totalAlertsCount} configured` : "Configure alerts"}
              tone="success"
            />
          </Link>
          <Link href="/candidate/applications" className="block h-full">
            <StatCard
              label="Interview Calls"
              value={applicationStats.interviews}
              icon={PhoneCall}
              tone="warning"
            />
          </Link>
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text">Recommended Jobs</h2>
          <Link
            href="/candidate/jobs"
            className="text-sm font-semibold text-primary hover:text-accent"
          >
            Browse all
          </Link>
        </div>
        {recommendedJobs.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {recommendedJobs.map((job) => (
              <DashboardJobCard
                key={job.id}
                job={job}
                onSave={(jobId) => toggleSave(jobId)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No recommendations yet"
            description="Complete your profile to get more personalized recommendations."
          />
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Upcoming Interviews</h2>
            <Link
              href="/candidate/applications"
              className="text-xs font-semibold text-primary hover:text-accent"
            >
              View all
            </Link>
          </div>
          {interviewApplications.length ? (
            <div className="mt-4 space-y-3">
              {interviewApplications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-2xl border border-border bg-surface/70 px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-text">{app.job.title}</p>
                      <p className="text-xs text-muted">
                        {app.job.companyName} · {app.job.location}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                      Interview Scheduled
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Applied {formatApplicationDate(app.appliedAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface/40 p-6 text-center">
              <p className="text-sm font-medium text-text">No upcoming interviews scheduled</p>
              <p className="mt-1 text-xs text-muted">
                When employers schedule interviews for your applications, they will appear here.
              </p>
              <Link
                href="/candidate/jobs"
                className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline"
              >
                Browse open SAP jobs
              </Link>
            </div>
          )}
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <ProgressCard
            title="Resume Score"
            description={`${resumeScore.label} — ${resumeScore.tip}`}
            progress={resumeScore.score}
            href="/candidate/resume"
            ctaLabel="Improve Resume"
          />
          <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Sparkles size={18} aria-hidden="true" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-text">Mock Interview</h3>
            <p className="mt-1 text-xs text-muted">
              Practice SAP module interviews with AI-guided feedback.
            </p>
            <Link
              href="/candidate/mock-interview"
              className="mt-4 inline-flex text-sm font-semibold text-primary hover:text-accent"
            >
              Start Practice
            </Link>
          </div>
          <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap size={18} aria-hidden="true" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-text">Learning Center</h3>
            <p className="mt-1 text-xs text-muted">
              Explore SAP skill tutorials, S/4HANA guides, and learning paths.
            </p>
            <Link
              href="/candidate/learning"
              className="mt-4 inline-flex text-sm font-semibold text-primary hover:text-accent"
            >
              Explore Courses
            </Link>
          </div>
          <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <Briefcase size={18} aria-hidden="true" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-text">Career Counselling</h3>
            <p className="mt-1 text-xs text-muted">
              Book a 1:1 session with an SAP career mentor.
            </p>
            <Link
              href="/candidate/career-counselling"
              className="mt-4 inline-flex text-sm font-semibold text-primary hover:text-accent"
            >
              Book Session
            </Link>
          </div>
        </div>
      </div>

      {/* Candidate Help & Support Assistance Banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-surface via-card to-surface p-5 sm:p-6 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <HelpCircle size={22} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text">Need assistance with your applications or account?</h3>
            <p className="text-xs text-muted mt-0.5">
              Have questions about your profile, resume score, or job matches? Our SAP candidate support team is here to help.
            </p>
          </div>
        </div>
        <Link
          href="/candidate/contact"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary text-white px-5 py-2.5 text-xs font-semibold shadow-soft transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
