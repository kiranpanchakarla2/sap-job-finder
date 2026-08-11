export const COMPANY_ABOUT_MAX_LENGTH = 1000;

export const EMPLOYER_ROUTES = {
  dashboard: "/employer/dashboard",
  onboarding: "/employer/onboarding",
  company: "/employer/company",
  profile: "/employer/profile",
  team: "/employer/team",
  postJob: "/employer/jobs/new",
  jobsNew: "/employer/jobs/new",
  jobs: "/employer/jobs",
  jobDetails: (id: string) => `/employer/jobs/${id}` as const,
  jobEdit: (id: string) => `/employer/jobs/${id}/edit` as const,
  jobPreview: (id: string) => `/employer/jobs/${id}/preview` as const,
  applicants: "/employer/applicants",
  applicantDetails: (id: string) => `/employer/applicants/${id}` as const,
  shortlisted: "/employer/shortlisted",
  interviews: "/employer/interviews",
  interviewDetails: (id: string) => `/employer/interviews/${id}` as const,
  messages: "/employer/messages",
  talentSearch: "/employer/talent-search",
  talentSearchSaved: "/employer/talent-search/saved",
  talentCandidate: (id: string) =>
    `/employer/talent-search/candidates/${id}` as const,
  analytics: "/employer/analytics",
  subscription: "/employer/subscription",
  settings: "/employer/settings",
  login: "/employer/login",
  landing: "/employer",
  forgotPassword: "/employer/forgot-password",
} as const;

export const ONBOARDING_STEPS = [
  {
    id: 1,
    title: "Company Information",
    description: "Tell candidates who you are and what industry you operate in.",
  },
  {
    id: 2,
    title: "Company Details",
    description: "Add location and a short story about your organization.",
  },
  {
    id: 3,
    title: "Recruiter Information",
    description: "Introduce the hiring contact candidates will engage with.",
  },
] as const;

export const COUNTRY_OPTIONS = [
  { value: "India", label: "India" },
  { value: "United States", label: "United States" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Germany", label: "Germany" },
  { value: "Singapore", label: "Singapore" },
  { value: "Australia", label: "Australia" },
  { value: "Canada", label: "Canada" },
  { value: "United Arab Emirates", label: "United Arab Emirates" },
  { value: "Other", label: "Other" },
] as const;
