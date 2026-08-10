export const siteConfig = {
  name: "SAP Jobs Finder",
  logoMark: "S",
  logoPrimary: "SAP Jobs ",
  logoAccent: "Finder",
  tagline: "Find Your Next SAP Career",
  heroHeadline: "Find SAP roles that",
  heroHeadlineAccent: "move your career forward.",
  heroSubheadline:
    "Search thousands of SAP jobs across Commerce, ABAP, Fiori, BTP and more — remote, hybrid, and onsite.",
  description:
    "Discover SAP jobs across Commerce, ABAP, Fiori, BTP, MM, SD, FICO and more. Build your profile, apply, and grow your SAP career.",
};

export const heroStats = [
  { value: "12,480+", label: "Open SAP roles" },
  { value: "2,100+", label: "Hiring companies" },
  { value: "48", label: "Countries" },
  { value: "4.8/5", label: "Candidate rating" },
] as const;

export const workModeOptions = [
  { label: "All work modes", value: "" },
  { label: "Remote", value: "remote" },
  { label: "Hybrid", value: "hybrid" },
  { label: "Onsite", value: "onsite" },
] as const;

/** @deprecated Prefer `mainNavMenus` from `@/lib/main-nav` for the public header. */
export const publicNavLinks = [
  { label: "Jobs", href: "/jobs" },
  { label: "Companies", href: "/companies" },
  { label: "Salaries", href: "/services/resources/salary-reports" },
  { label: "Career Services", href: "/services" },
  { label: "Resources", href: "/services" },
] as const;

export const sapModules = [
  { name: "SAP Commerce", slug: "commerce" },
  { name: "ABAP", slug: "abap" },
  { name: "Fiori", slug: "fiori" },
  { name: "BTP", slug: "btp" },
  { name: "MM", slug: "mm" },
  { name: "SD", slug: "sd" },
  { name: "FICO", slug: "fico" },
] as const;

/** Homepage grid — SAP modules with open role counts. */
export const popularVacancies = [
  { name: "SAP ABAP", slug: "abap", openPositions: 18420 },
  { name: "SAP FICO", slug: "fico", openPositions: 14892 },
  { name: "SAP MM", slug: "mm", openPositions: 11356 },
  { name: "SAP SD", slug: "sd", openPositions: 10847 },
  { name: "SAP S/4HANA", slug: "s4hana", openPositions: 9624 },
  { name: "SAP Basis", slug: "basis", openPositions: 8215 },
  { name: "SAP SuccessFactors", slug: "successfactors", openPositions: 7438 },
  { name: "SAP BTP", slug: "btp", openPositions: 6902 },
  { name: "SAP BW", slug: "bw", openPositions: 5671 },
  { name: "SAP Fiori", slug: "fiori", openPositions: 5284 },
  { name: "SAP Ariba", slug: "ariba", openPositions: 4156 },
  { name: "SAP PP", slug: "pp", openPositions: 3892 },
] as const;

export const howItWorksSteps = [
  {
    title: "Create account",
    description:
      "Register as a candidate in minutes. Choose your SAP modules and set your job preferences.",
    icon: "UserPlus" as const,
  },
  {
    title: "Upload CV / Resume",
    description:
      "Add your SAP experience, certifications, and resume so recruiters can find you faster.",
    icon: "Upload" as const,
  },
  {
    title: "Find suitable SAP job",
    description:
      "Search and filter roles by module, location, and work mode across the SAP ecosystem.",
    icon: "Search" as const,
  },
  {
    title: "Apply to jobs",
    description:
      "Submit applications in one click and track every status from your candidate dashboard.",
    icon: "BadgeCheck" as const,
  },
] as const;

export const testimonials = [
  {
    id: "1",
    quote:
      "SAP Jobs Finder helped me land a remote SAP FICO role in under three weeks. The module filters and company profiles made my search focused and efficient.",
    name: "Priya Sharma",
    role: "SAP FICO Consultant",
    avatar: "PS",
    avatarColor: "#6366F1",
    rating: 5,
  },
  {
    id: "2",
    quote:
      "I uploaded my resume once and started getting matched with ABAP and RAP roles immediately. The apply flow is smooth — no more repeating the same details on every portal.",
    name: "Arjun Mehta",
    role: "SAP ABAP Developer",
    avatar: "AM",
    avatarColor: "#0D9488",
    rating: 5,
  },
  {
    id: "3",
    quote:
      "As a BTP architect, I needed niche integration roles. This platform surfaced opportunities I never found on generic job boards. Highly recommend for SAP specialists.",
    name: "Sneha Reddy",
    role: "SAP BTP Architect",
    avatar: "SR",
    avatarColor: "#0891B2",
    rating: 5,
  },
  {
    id: "4",
    quote:
      "The featured jobs section and company pages gave me confidence before applying. I accepted an MM consultant offer with a top SI partner within a month.",
    name: "Vikram Singh",
    role: "SAP MM Lead",
    avatar: "VS",
    avatarColor: "#CA8A04",
    rating: 5,
  },
  {
    id: "5",
    quote:
      "Clean UI, relevant SAP-only listings, and a dashboard to track applications — exactly what I wanted after years on cluttered general job sites.",
    name: "Ananya Iyer",
    role: "SAP Fiori Developer",
    avatar: "AI",
    avatarColor: "#8B5CF6",
    rating: 5,
  },
] as const;

export const candidateSidebarLinks = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Jobs", href: "/jobs", icon: "Briefcase" },
  { label: "My Applications", href: "/applications", icon: "FileText" },
  { label: "My Profile", href: "/profile", icon: "User" },
  { label: "Resume", href: "/profile?tab=resume", icon: "File" },
  { label: "Mock Interview", href: "/mock-interview", icon: "Target" },
  { label: "Companies", href: "/companies", icon: "Building2" },
  { label: "Saved Jobs", href: "/jobs?saved=1", icon: "Heart", disabled: true },
  { label: "Settings", href: "/profile", icon: "Settings", disabled: true },
] as const;
