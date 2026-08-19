/**
 * Public header navigation — SAP professional journey structure.
 * Find Jobs → Explore Companies → Understand Salaries → Improve Career → Learn & Connect
 */

export type NavLinkItem = {
  label: string;
  href: string;
  badge?: "NEW" | "COMING SOON";
  featured?: boolean;
};

export type NavColumn = {
  title: string;
  links: NavLinkItem[];
  badge?: "SOON";
};

export type NavMenuId =
  | "jobs"
  | "talent-hub"
  | "services"
  | "why-sap-job-finder"
  | "companies"
  | "salaries"
  | "career-services"
  | "resources";

export type NavMenuConfig = {
  id: NavMenuId;
  label: string;
  href: string;
  variant: "mega" | "dropdown";
  columns: NavColumn[];
  footer: { label: string; href: string };
};

export const jobsMenu: NavMenuConfig = {
  id: "jobs",
  label: "Jobs",
  href: "/jobs",
  variant: "mega",
  columns: [
    {
      title: "Find Jobs",
      links: [
        { label: "All SAP Jobs", href: "/jobs" },
        { label: "Remote SAP Jobs", href: "/jobs?workMode=remote" },
        { label: "Contract SAP Jobs", href: "/jobs?type=contract" },
        { label: "Fresh SAP Jobs", href: "/jobs?fresh=1" },
      ],
    },
    {
      title: "Browse by SAP Skill",
      links: [
        { label: "SAP FICO", href: "/jobs?module=SAP+FICO" },
        { label: "SAP MM", href: "/jobs?module=SAP+MM" },
        { label: "SAP SD", href: "/jobs?module=SAP+SD" },
        { label: "SAP ABAP", href: "/jobs?module=SAP+ABAP" },
        { label: "SAP BTP", href: "/jobs?module=SAP+BTP" },
        { label: "SAP SuccessFactors", href: "/jobs?module=SAP+SuccessFactors" },
        { label: "SAP Basis", href: "/jobs?module=SAP+Basis" },
      ],
    },
    {
      title: "Browse by Location",
      links: [
        { label: "India", href: "/jobs?location=India" },
        { label: "Hyderabad", href: "/jobs?location=Hyderabad" },
        { label: "Bangalore", href: "/jobs?location=Bangalore" },
        { label: "Pune", href: "/jobs?location=Pune" },
        { label: "Mumbai", href: "/jobs?location=Mumbai" },
        { label: "Chennai", href: "/jobs?location=Chennai" },
        { label: "Remote", href: "/jobs?workMode=remote" },
      ],
    },
  ],
  footer: { label: "View all jobs", href: "/jobs" },
};

export const talentHubMenu: NavMenuConfig = {
  id: "talent-hub",
  label: "Talent Hub",
  href: "/talent-hub",
  variant: "mega",
  columns: [
    {
      title: "Find SAP Talent",
      links: [
        {
          label: "Find SAP Talent",
          href: "/talent-hub/search",
        },
        {
          label: "SAP Consultants",
          href: "/talent-hub/search?type=consultant",
        },
        {
          label: "SAP Developers",
          href: "/talent-hub/search?type=developer",
        },
        {
          label: "SAP Architects",
          href: "/talent-hub/search?type=architect",
        },
      ],
    },
    {
      title: "Talent Hub",
      links: [
        {
          label: "How Talent Hub Works",
          href: "/talent-hub#how-it-works",
        },
        {
          label: "For SAP Professionals",
          href: "/talent-hub#professionals",
        },
        {
          label: "For Employers",
          href: "/talent-hub#employers",
        },
        {
          label: "Talent Hub Guidelines",
          href: "/talent-hub#guidelines",
        },
      ],
    },
  ],
  footer: {
    label: "Explore Talent Hub",
    href: "/talent-hub",
  },
};

export const servicesMenu: NavMenuConfig = {
  id: "services",
  label: "Services",
  href: "/services",
  variant: "mega",
  columns: [
    {
      title: "For Candidates",
      badge: "SOON",
      links: [
        {
          label: "Resume Services",
          href: "/services/resume",
        },
        {
          label: "Mock Interviews",
          href: "/services/mock-interviews",
        },
        {
          label: "Career Guidance",
          href: "/services/career-guidance",
        },
        {
          label: "SAP Career Coaching",
          href: "/services/career-coaching",
        },
      ],
    },
    {
      title: "Learning",
      badge: "SOON",
      links: [
        {
          label: "SAP Learning",
          href: "/services/learning",
        },
        {
          label: "SAP Certification Guidance",
          href: "/services/certification",
        },
        {
          label: "Interview Preparation",
          href: "/services/interview-preparation",
        },
        {
          label: "Career Resources",
          href: "/services/resources",
        },
      ],
    },
    {
      title: "Community",
      badge: "SOON",
      links: [
        {
          label: "SAP Community",
          href: "/community",
        },
        {
          label: "Discussions",
          href: "/community/discussions",
        },
        {
          label: "Interview Experiences",
          href: "/community/interview-experiences",
        },
        {
          label: "SAP Professionals",
          href: "/community/professionals",
        },
      ],
    },
  ],
  footer: {
    label: "Explore all services",
    href: "/services",
  },
};

export const whySapJobFinderMenu: NavMenuConfig = {
  id: "why-sap-job-finder",
  label: "Why SAP Jobs Finder?",
  href: "/why-sap-job-finder",
  variant: "dropdown",
  columns: [
    {
      title: "Why SAP Jobs Finder?",
      links: [
        {
          label: "Our Mission",
          href: "/why-sap-job-finder",
        },
        {
          label: "About SAP Jobs Finder",
          href: "/why-sap-job-finder#about",
        },
        {
          label: "For SAP Professionals",
          href: "/why-sap-job-finder/candidates",
        },
        {
          label: "For Employers",
          href: "/why-sap-job-finder/employers",
        },
      ],
    },
    {
      title: "Connect",
      links: [
        {
          label: "Success Stories",
          href: "/success-stories",
        },
        {
          label: "Contact Us",
          href: "/contact",
        },
      ],
    },
  ],
  footer: {
    label: "Discover SAP Jobs Finder",
    href: "/why-sap-job-finder",
  },
};

export const companiesMenu: NavMenuConfig = {
  id: "companies",
  label: "Companies",
  href: "/companies",
  variant: "dropdown",
  columns: [
    {
      title: "Companies",
      links: [
        { label: "Top SAP Employers", href: "/companies" },
        { label: "SAP Consulting Companies", href: "/companies?type=consulting" },
        { label: "SAP Partners", href: "/companies?type=partners" },
        { label: "Product Companies", href: "/companies?type=product" },
        { label: "Browse All Companies", href: "/companies" },
      ],
    },
    {
      title: "Company Insights",
      links: [
        { label: "Company Reviews", href: "/companies#reviews" },
        {
          label: "Interview Experiences",
          href: "/services/community/interview-experiences",
        },
        {
          label: "Salary Insights",
          href: "/services/resources/salary-reports",
        },
      ],
    },
  ],
  footer: { label: "Explore companies", href: "/companies" },
};

export const salariesMenu: NavMenuConfig = {
  id: "salaries",
  label: "Salaries",
  href: "/services/resources/salary-reports",
  variant: "dropdown",
  columns: [
    {
      title: "Salaries",
      links: [
        { label: "SAP Salary Guide", href: "/services/resources/salary-reports" },
        { label: "Salary by Role", href: "/services/resources/salary-reports#by-role" },
        {
          label: "Salary by Experience",
          href: "/services/resources/salary-reports#by-experience",
        },
        {
          label: "Salary by Location",
          href: "/services/resources/salary-reports#by-location",
        },
        {
          label: "SAP Consultant Salaries",
          href: "/services/resources/salary-reports#consultants",
        },
      ],
    },
    {
      title: "Tools",
      links: [
        {
          label: "Salary Calculator",
          href: "/services/career-services/salary-guidance",
        },
      ],
    },
  ],
  footer: {
    label: "Explore salary insights",
    href: "/services/resources/salary-reports",
  },
};

/**
 * Career Services = tools/services that help a candidate advance.
 * Strictly 3 columns. No Events / Career Resources here.
 */
export const careerServicesMenu: NavMenuConfig = {
  id: "career-services",
  label: "Career Services",
  href: "/services",
  variant: "mega",
  columns: [
    {
      title: "Career Services",
      links: [
        {
          label: "Career Counselling",
          href: "/services/career-services/career-counselling",
        },
        {
          label: "Resume Review",
          href: "/services/career-services/resume-review",
        },
        {
          label: "Mock Interviews",
          href: "/mock-interview",
          badge: "NEW",
          featured: true,
        },
        {
          label: "Mentorship",
          href: "/services/career-services/mentorship",
        },
        {
          label: "Certification Guidance",
          href: "/services/career-services/certification-guidance",
        },
      ],
    },
    {
      title: "Learning Center",
      links: [
        { label: "Learning Paths", href: "/services/learning-center/learning-paths" },
        {
          label: "SAP Career Roadmaps",
          href: "/services/learning-center/sap-roadmaps",
        },
        {
          label: "Practice Questions",
          href: "/services/learning-center/practice-questions",
        },
        { label: "Mock Tests", href: "/services/learning-center/mock-tests" },
      ],
    },
    {
      title: "Community",
      links: [
        { label: "Discussions", href: "/services/community/discussions" },
        {
          label: "Interview Experiences",
          href: "/services/community/interview-experiences",
        },
        { label: "Referral Board", href: "/services/community/referral-board" },
        {
          label: "SAP Professionals",
          href: "/services/community/success-stories",
        },
      ],
    },
  ],
  footer: { label: "View all career services", href: "/services" },
};

/**
 * Resources = informational content, community discovery, learning, events.
 * Strictly 4 columns. No service booking links from Career Services.
 */
export const resourcesMenu: NavMenuConfig = {
  id: "resources",
  label: "Resources",
  href: "/services",
  variant: "mega",
  columns: [
    {
      title: "Community & Support",
      links: [
        { label: "SAP Community", href: "/services/community/discussions" },
        { label: "Ask an Expert", href: "/services/community/discussions" },
        {
          label: "SAP Professionals",
          href: "/services/community/success-stories",
        },
        {
          label: "Contact Us",
          href: "/contact",
        },
      ],
    },
    {
      title: "Learning Center",
      links: [
        { label: "SAP Learning", href: "/services/learning-center/learning-paths" },
        { label: "Tutorials", href: "/services/learning-center/sap-roadmaps" },
        {
          label: "SAP Certification",
          href: "/services/resources/certification-guides",
        },
        {
          label: "Interview Questions",
          href: "/services/resources/interview-questions",
        },
        { label: "Career Guides", href: "/services/resources/blogs" },
      ],
    },
    {
      title: "Events",
      links: [
        { label: "SAP Events", href: "/services/events/webinars" },
        { label: "Webinars", href: "/services/events/webinars" },
        { label: "Workshops", href: "/services/events/workshops" },
        { label: "Meetups", href: "/services/events/meetups" },
      ],
    },
    {
      title: "Career Resources",
      links: [
        {
          label: "Resume Guides",
          href: "/services/resources/resume-templates",
        },
        {
          label: "Interview Guides",
          href: "/services/resources/interview-questions",
        },
        { label: "Salary Guides", href: "/services/resources/salary-reports" },
        {
          label: "SAP Career Roadmaps",
          href: "/services/learning-center/sap-roadmaps",
        },
        {
          label: "SAP Job Market Insights",
          href: "/services/resources/salary-reports",
        },
      ],
    },
  ],
  footer: { label: "Explore all resources", href: "/services" },
};

export const mainNavMenus: NavMenuConfig[] = [
  jobsMenu,
  talentHubMenu,
  servicesMenu,
  whySapJobFinderMenu,

  // Future navigation — keep commented for now
  // companiesMenu,
  // salariesMenu,
  // careerServicesMenu,
  // resourcesMenu,
];

export const authNav = {
  signIn: { label: "Sign in", href: "/login/candidate" },
  employers: {
    label: "Employers / Post a Job",
    href: "/employer/login",
  },
} as const;
