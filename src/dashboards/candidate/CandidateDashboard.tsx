"use client";

import Link from "next/link";
import {
  Bookmark,
  Briefcase,
  Eye,
  PhoneCall,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import { DashboardJobCard } from "@/components/dashboard/shared/JobCard";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { ProgressCard } from "@/components/dashboard/shared/ProgressCard";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import {
  candidateDashboardStats,
  learningCourses,
  recommendedJobs,
  upcomingInterviews,
} from "@/data/mockData";

export function CandidateDashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "Candidate";

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted">
            Continue your SAP Jobs Finder career journey with tailored SAP opportunities.
          </p>
        </div>
        <Link
          href="/candidate/profile"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          Complete Profile
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ProgressCard
            title="Profile Completion"
            description="Add resume, skills, and certifications to improve matches."
            progress={85}
            href="/candidate/profile"
            ctaLabel="Complete Profile"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <StatCard
            label="Applied Jobs"
            value={candidateDashboardStats.appliedJobs}
            icon={Briefcase}
          />
          <StatCard
            label="Saved Jobs"
            value={candidateDashboardStats.savedJobs}
            icon={Bookmark}
            tone="info"
          />
          <StatCard
            label="Interview Calls"
            value={candidateDashboardStats.interviewCalls}
            icon={PhoneCall}
            tone="success"
          />
          <StatCard
            label="Profile Views"
            value={candidateDashboardStats.profileViews}
            icon={Eye}
            tone="warning"
          />
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text">Recommended Jobs</h2>
          <Link
            href="/jobs"
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
                onSave={() => toast.success("Job saved to your list")}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No recommendations yet"
            description="Complete your profile to get personalized SAP job matches."
          />
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-text">Upcoming Interviews</h2>
          <div className="mt-4 space-y-3">
            {upcomingInterviews.map((interview) => (
              <div
                key={interview.id}
                className="rounded-2xl border border-border bg-surface/70 px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-text">{interview.jobTitle}</p>
                    <p className="text-xs text-muted">{interview.company}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    {interview.mode}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted">{interview.scheduledAt}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <ProgressCard
            title="Resume Score"
            description="Strong foundation — add certifications for a higher score."
            progress={78}
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
          <ProgressCard
            title="Learning Progress"
            description={learningCourses[0]?.title}
            progress={learningCourses[0]?.progress ?? 0}
            href="/candidate/learning"
            ctaLabel="Continue Learning"
          />
          <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
            <h3 className="text-sm font-semibold text-text">Career Counselling</h3>
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
    </div>
  );
}
