import type { EmployerFeatureOption } from "../types/plan.types";

export const EMPLOYER_FEATURE_OPTIONS: EmployerFeatureOption[] = [
  {
    key: "basic_analytics",
    label: "Basic Job Analytics",
    category: "analytics",
    description: "Track views, application counts, and posting trends.",
  },
  {
    key: "advanced_analytics",
    label: "Advanced Hiring Analytics & Conversion",
    category: "analytics",
    description: "Funnel conversion rates, time-to-hire metrics, and sourcing breakdowns.",
  },
  {
    key: "talent_search",
    label: "Talent Search & Candidate Discovery",
    category: "search",
    description: "Access verified SAP candidate database with granular module & experience filters.",
  },
  {
    key: "candidate_messaging",
    label: "Candidate Direct Messaging",
    category: "interviews",
    description: "Communicate directly with applicants and shortlisted talent within the platform.",
  },
  {
    key: "interview_management",
    label: "Interview Scheduling & Feedback",
    category: "interviews",
    description: "Coordinate interview slots, meeting links, and structured interviewer scorecards.",
  },
  {
    key: "team_members",
    label: "Multi-User Team Seat Management",
    category: "team",
    description: "Invite recruitment colleagues, assign hiring roles, and collaborate on pipelines.",
  },
  {
    key: "bulk_upload",
    label: "Bulk Job Import (Excel/Spreadsheet)",
    category: "jobs",
    description: "Import dozens of SAP openings simultaneously via XLSX templates.",
  },
  {
    key: "priority_support",
    label: "Dedicated Account Manager & SLA Support",
    category: "support",
    description: "Priority enterprise phone and email support with expedited SLAs.",
  },
];

export const EMPLOYER_DEFAULT_BULLETS: Record<string, string[]> = {
  free: [
    "5 active jobs",
    "Basic applicant management",
    "Basic analytics",
    "Interview scheduling",
    "Candidate messaging",
  ],
  pro: [
    "25 active jobs",
    "Bulk Job Upload (Excel)",
    "Talent Search & Discovery (100 views)",
    "Team Management (5 seats)",
    "Advanced Analytics",
    "Interview scheduling & scorecards",
  ],
  business: [
    "Unlimited active jobs",
    "Unlimited Bulk Job Uploads",
    "Unlimited Talent Search access",
    "Unlimited Team seats",
    "Dedicated Account Manager",
    "Custom hiring workflows",
    "Priority 24/7 SLA Support",
  ],
};
