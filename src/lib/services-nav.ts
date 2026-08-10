export type ServiceLink = {
  label: string;
  slug: string;
  description: string;
};

export type ServiceGroup = {
  id: string;
  label: string;
  links: ServiceLink[];
};

export const serviceGroups: ServiceGroup[] = [
  {
    id: "career-services",
    label: "Career Services",
    links: [
      {
        label: "Career Counselling",
        slug: "career-counselling",
        description: "Book sessions with SAP career experts",
      },
      {
        label: "Resume Review",
        slug: "resume-review",
        description: "Expert feedback on your SAP resume",
      },
      {
        label: "Mock Interviews",
        slug: "mock-interviews",
        description: "Practice SAP interviews with structured feedback",
      },
      {
        label: "Mentorship",
        slug: "mentorship",
        description: "Long-term guidance from senior practitioners",
      },
      {
        label: "Certification Guidance",
        slug: "certification-guidance",
        description: "Plan certifications that match your goals",
      },
      {
        label: "Salary Guidance",
        slug: "salary-guidance",
        description: "Benchmark pay across modules and regions",
      },
    ],
  },
  {
    id: "learning-center",
    label: "Learning Center",
    links: [
      {
        label: "Learning Paths",
        slug: "learning-paths",
        description: "Structured paths by SAP module and role",
      },
      {
        label: "SAP Roadmaps",
        slug: "sap-roadmaps",
        description: "Visual roadmaps for Commerce, ABAP, BTP, and more",
      },
      {
        label: "Practice Questions",
        slug: "practice-questions",
        description: "Module-wise questions to sharpen your skills",
      },
      {
        label: "Mock Tests",
        slug: "mock-tests",
        description: "Timed assessments before certification or interviews",
      },
    ],
  },
  {
    id: "community",
    label: "Community",
    links: [
      {
        label: "Discussions",
        slug: "discussions",
        description: "Ask questions and share SAP career insights",
      },
      {
        label: "Interview Experiences",
        slug: "interview-experiences",
        description: "Real interview stories from SAP professionals",
      },
      {
        label: "Referral Board",
        slug: "referral-board",
        description: "Find and share referral opportunities",
      },
      {
        label: "Success Stories",
        slug: "success-stories",
        description: "Career wins from candidates on the platform",
      },
    ],
  },
  {
    id: "events",
    label: "Events",
    links: [
      {
        label: "Webinars",
        slug: "webinars",
        description: "Live sessions on SAP modules and hiring trends",
      },
      {
        label: "Hiring Drives",
        slug: "hiring-drives",
        description: "Employer-led recruitment events",
      },
      {
        label: "Meetups",
        slug: "meetups",
        description: "Local and virtual SAP community meetups",
      },
      {
        label: "Workshops",
        slug: "workshops",
        description: "Hands-on skill-building workshops",
      },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    links: [
      {
        label: "Blogs",
        slug: "blogs",
        description: "Articles on SAP careers and technology",
      },
      {
        label: "Interview Questions",
        slug: "interview-questions",
        description: "Common SAP interview questions by module",
      },
      {
        label: "Resume Templates",
        slug: "resume-templates",
        description: "SAP-focused resume templates and examples",
      },
      {
        label: "Salary Reports",
        slug: "salary-reports",
        description: "Compensation trends across SAP roles",
      },
      {
        label: "Certification Guides",
        slug: "certification-guides",
        description: "Guides for SAP certification preparation",
      },
    ],
  },
];

export const careerCounsellingExperts = [
  "SAP Commerce Architect",
  "SAP Technical Architect",
  "SAP ABAP Lead",
  "SAP Fiori Lead",
  "SAP BTP Architect",
  "SAP SuccessFactors Consultant",
] as const;

export const careerCounsellingTopics = [
  "Career planning",
  "Technology selection",
  "Salary negotiation",
  "Interview preparation",
  "Resume review",
  "Certification guidance",
  "Switching modules",
  "Moving abroad",
] as const;

const pageSubtitles: Record<string, string> = {
  "career-counselling":
    "Book a 30-minute or 60-minute session with SAP career experts.",
  "resume-review":
    "Expert feedback on your SAP resume, skills positioning, and module focus.",
  "salary-guidance":
    "Understand market rates for your SAP module, experience, and location.",
  "mock-interviews":
    "Practice SAP interviews with structured feedback before the real thing.",
  mentorship: "Ongoing guidance from senior SAP practitioners as you grow your career.",
  "certification-guidance":
    "Choose the right SAP certifications for your target role and module path.",
  "learning-paths": "Follow curated learning paths aligned to SAP modules and job roles.",
  "sap-roadmaps": "Explore visual roadmaps for SAP Commerce, ABAP, Fiori, BTP, and S/4HANA.",
  "practice-questions": "Practice module-specific questions before interviews and certifications.",
  "mock-tests": "Take timed mock tests to assess readiness for SAP interviews and certs.",
  discussions: "Join conversations with SAP professionals across modules and regions.",
  "interview-experiences": "Read and share real SAP interview experiences from the community.",
  "referral-board": "Discover referral openings and connect with employees at hiring companies.",
  "success-stories": "Learn how candidates landed their next SAP role through the platform.",
  webinars: "Register for upcoming webinars on SAP skills, hiring, and career growth.",
  "hiring-drives": "Explore employer hiring drives focused on SAP talent.",
  meetups: "Find SAP community meetups online and in your city.",
  workshops: "Join hands-on workshops to build practical SAP skills.",
  blogs: "Read articles on SAP careers, modules, certifications, and market trends.",
  "interview-questions": "Browse SAP interview questions organized by module and seniority.",
  "resume-templates": "Download SAP-focused resume templates and formatting guides.",
  "salary-reports": "Access salary reports for SAP roles across India and global markets.",
  "certification-guides": "Step-by-step guides for SAP certification preparation and exam strategy.",
};

export function getServiceHref(categoryId: string, slug: string) {
  // Featured mock interview experience lives on a dedicated page.
  if (slug === "mock-interviews") {
    return "/mock-interview";
  }
  return `/services/${categoryId}/${slug}`;
}

export function findServicePage(categoryId: string, slug: string) {
  const group = serviceGroups.find((item) => item.id === categoryId);
  const link = group?.links.find((item) => item.slug === slug);
  if (!group || !link) return null;

  return {
    group,
    link,
    href: getServiceHref(categoryId, slug),
    subtitle: pageSubtitles[slug] ?? `Explore ${link.label} on SAP Jobs Finder.`,
  };
}

export function getAllServicePages() {
  return serviceGroups.flatMap((group) =>
    group.links.map((link) => ({
      categoryId: group.id,
      categoryLabel: group.label,
      ...link,
      href: getServiceHref(group.id, link.slug),
    })),
  );
}

/** @deprecated Use serviceGroups — kept for legacy imports */
export const careerHubLinks = serviceGroups[0].links.map((link) => ({
  label: link.label,
  href: getServiceHref("career-services", link.slug),
  description: link.description,
}));

export type CareerHubSlug = (typeof serviceGroups)[0]["links"][number]["slug"];

export const careerHubPages = Object.fromEntries(
  serviceGroups[0].links.map((link) => [
    link.slug,
    {
      title: link.label,
      subtitle: pageSubtitles[link.slug] ?? link.description,
    },
  ]),
) as Record<CareerHubSlug, { title: string; subtitle: string }>;
