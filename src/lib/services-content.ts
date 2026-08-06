import {
  CalendarDays,
  GraduationCap,
  Handshake,
  Library,
  Users,
  type LucideIcon,
} from "lucide-react";
import { getServiceHref } from "./services-nav";

export type ServiceFeatureDetail = {
  slug: string;
  label: string;
  summary: string;
  details: string[];
};

export type ServiceSectionDetail = {
  id: string;
  label: string;
  icon: LucideIcon;
  overview: string;
  highlights: string[];
  features: ServiceFeatureDetail[];
};

export const servicesOverviewIntro = {
  title: "Services built for SAP careers",
  subtitle:
    "Everything you need to find roles, grow skills, connect with peers, attend events, and access expert resources — in one SAP-focused platform.",
};

export const serviceSectionDetails: ServiceSectionDetail[] = [
  {
    id: "career-services",
    label: "Career Services",
    icon: Handshake,
    overview:
      "Personalized career support from SAP practitioners who understand modules, markets, and hiring expectations. Whether you are switching modules, preparing for interviews, or planning a move abroad, Career Services gives you structured guidance.",
    highlights: [
      "1:1 sessions with module specialists",
      "Resume and salary support",
      "Certification and mentorship planning",
    ],
    features: [
      {
        slug: "career-counselling",
        label: "Career Counselling",
        summary: "Book 30- or 60-minute sessions with SAP architects and leads.",
        details: [
          "Speak with experts across Commerce, ABAP, Fiori, BTP, and SuccessFactors",
          "Get help with career planning, module switches, and interview prep",
          "Choose focused quick guidance or a deep-dive roadmap session",
        ],
      },
      {
        slug: "resume-review",
        label: "Resume Review",
        summary: "Position your SAP experience clearly for recruiters and ATS systems.",
        details: [
          "Module-specific keyword and skills alignment",
          "Project impact rewrites for consultant and developer profiles",
          "Formatting guidance for India and global SAP hiring markets",
        ],
      },
      {
        slug: "salary-guidance",
        label: "Salary Guidance",
        summary: "Understand compensation bands before you negotiate an offer.",
        details: [
          "Benchmarks by module, seniority, and work mode",
          "Remote vs hybrid vs onsite pay comparisons",
          "Offer evaluation for contract, full-time, and leadership roles",
        ],
      },
      {
        slug: "mentorship",
        label: "Mentorship",
        summary: "Long-term support from senior SAP professionals as you grow.",
        details: [
          "Ongoing check-ins on projects, skills, and career goals",
          "Guidance through certifications and internal promotions",
          "Accountability for job search and upskilling plans",
        ],
      },
      {
        slug: "certification-guidance",
        label: "Certification Guidance",
        summary: "Pick certifications that match your target SAP role.",
        details: [
          "Associate vs professional certification paths",
          "Module-specific cert sequencing for ABAP, FICO, BTP, and more",
          "Exam strategy and study plan recommendations",
        ],
      },
    ],
  },
  {
    id: "learning-center",
    label: "Learning Center",
    icon: GraduationCap,
    overview:
      "Structured learning for SAP professionals at every stage — from associate consultants to architects. Follow curated paths, visual roadmaps, and assessments that mirror real certification and interview expectations.",
    highlights: [
      "Module-based learning paths",
      "Visual SAP roadmaps",
      "Practice questions and mock tests",
    ],
    features: [
      {
        slug: "learning-paths",
        label: "Learning Paths",
        summary: "Step-by-step curricula aligned to job roles and experience levels.",
        details: [
          "Paths for developers, functional consultants, and architects",
          "Beginner to advanced tracks across SAP modules",
          "Milestone checkpoints tied to portfolio and job readiness",
        ],
      },
      {
        slug: "sap-roadmaps",
        label: "SAP Roadmaps",
        summary: "Visual guides for Commerce, S/4HANA, BTP, Fiori, and integration stacks.",
        details: [
          "Technology progression from fundamentals to expert topics",
          "Cross-module dependencies and recommended learning order",
          "Printable roadmaps for self-paced study planning",
        ],
      },
      {
        slug: "practice-questions",
        label: "Practice Questions",
        summary: "Sharpen knowledge with module-wise question banks.",
        details: [
          "Questions tagged by module, difficulty, and interview type",
          "Explanations for technical and scenario-based answers",
          "Ideal for daily revision before interviews or exams",
        ],
      },
      {
        slug: "mock-tests",
        label: "Mock Tests",
        summary: "Timed assessments that simulate certification and interview pressure.",
        details: [
          "Full-length and topic-wise mock exams",
          "Performance breakdown by skill area",
          "Retry modes to track improvement over time",
        ],
      },
    ],
  },
  {
    id: "community",
    label: "Community",
    icon: Users,
    overview:
      "Connect with SAP professionals who share interviews, referrals, and career wins. Learn from peers who have navigated the same modules, clients, and hiring cycles you are targeting.",
    highlights: [
      "Peer discussions and Q&A",
      "Interview experience library",
      "Referrals and success stories",
    ],
    features: [
      {
        slug: "discussions",
        label: "Discussions",
        summary: "Ask questions and share insights across SAP modules and careers.",
        details: [
          "Topic threads for ABAP, FICO, BTP, Fiori, and more",
          "Advice on projects, certifications, and client scenarios",
          "Moderated spaces for constructive professional exchange",
        ],
      },
      {
        slug: "interview-experiences",
        label: "Interview Experiences",
        summary: "Read real SAP interview stories from candidates and consultants.",
        details: [
          "Company-wise and module-wise experience posts",
          "Technical vs functional interview breakdowns",
          "Preparation tips from professionals who recently cleared rounds",
        ],
      },
      {
        slug: "referral-board",
        label: "Referral Board",
        summary: "Discover referral opportunities shared by employees and recruiters.",
        details: [
          "Open roles eligible for employee referral programs",
          "Guidance on referral etiquette and follow-up",
          "Connections to SAP hiring teams and SI partners",
        ],
      },
      {
        slug: "success-stories",
        label: "Success Stories",
        summary: "Career transformation stories from SAP Jobs Finder candidates.",
        details: [
          "Module switch and upskilling journeys",
          "Remote and international placement examples",
          "How counselling, learning, and community support helped",
        ],
      },
    ],
  },
  {
    id: "events",
    label: "Events",
    icon: CalendarDays,
    overview:
      "Stay active in the SAP ecosystem through webinars, hiring drives, meetups, and workshops. Meet employers, trainers, and community members focused on the same technologies you work with.",
    highlights: [
      "Live expert webinars",
      "Employer hiring drives",
      "Meetups and hands-on workshops",
    ],
    features: [
      {
        slug: "webinars",
        label: "Webinars",
        summary: "Live sessions on SAP skills, hiring trends, and career growth.",
        details: [
          "Module deep-dives with practitioners and architects",
          "Q&A on certifications, salaries, and market demand",
          "Recordings available for registered candidates",
        ],
      },
      {
        slug: "hiring-drives",
        label: "Hiring Drives",
        summary: "Focused recruitment events from SAP hiring partners.",
        details: [
          "Bulk openings across modules and experience bands",
          "Fast-track screening with participating employers",
          "Pre-event resume and profile preparation guidance",
        ],
      },
      {
        slug: "meetups",
        label: "Meetups",
        summary: "Virtual and in-person SAP community gatherings.",
        details: [
          "City chapters and online networking sessions",
          "Lightning talks from consultants and developers",
          "Peer networking for referrals and learning groups",
        ],
      },
      {
        slug: "workshops",
        label: "Workshops",
        summary: "Hands-on sessions to build practical SAP skills.",
        details: [
          "Lab-style workshops for Fiori, BTP, ABAP, and integration topics",
          "Resume, interview, and negotiation skills workshops",
          "Small-group formats with actionable takeaways",
        ],
      },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    icon: Library,
    overview:
      "Free and premium reference material to support your job search and continuous learning — blogs, interview banks, resume templates, salary reports, and certification guides curated for SAP roles.",
    highlights: [
      "Expert blogs and guides",
      "Interview and resume libraries",
      "Salary and certification reports",
    ],
    features: [
      {
        slug: "blogs",
        label: "Blogs",
        summary: "Articles on SAP careers, technology shifts, and hiring insights.",
        details: [
          "Module trend analysis and skill demand updates",
          "Career advice from recruiters and SAP practitioners",
          "New content weekly across technical and functional topics",
        ],
      },
      {
        slug: "interview-questions",
        label: "Interview Questions",
        summary: "Common SAP interview questions organized by module and level.",
        details: [
          "Technical, functional, and scenario-based question sets",
          "Architecture and integration question banks",
          "Suggested answer frameworks for consultants and developers",
        ],
      },
      {
        slug: "resume-templates",
        label: "Resume Templates",
        summary: "SAP-focused resume layouts and examples that recruiters expect.",
        details: [
          "Templates for freshers, consultants, and architects",
          "Module-specific skills section examples",
          "ATS-friendly formatting guidelines",
        ],
      },
      {
        slug: "salary-reports",
        label: "Salary Reports",
        summary: "Compensation trends for SAP roles in India and global markets.",
        details: [
          "Reports by module, city, and years of experience",
          "Contract vs permanent compensation benchmarks",
          "Updated quarterly from market and community data",
        ],
      },
      {
        slug: "certification-guides",
        label: "Certification Guides",
        summary: "Preparation guides for SAP certification exams.",
        details: [
          "Syllabus breakdowns and recommended study materials",
          "Exam format tips and time management strategies",
          "Cert-to-role mapping for career progression",
        ],
      },
    ],
  },
];

export const contactSection = {
  title: "Contact us",
  subtitle:
    "Questions about Career Services, Learning Center access, events, or employer partnerships? Our team is here to help.",
  email: "support@sapjobsfinder.com",
  topics: [
    "Career Services & counselling",
    "Learning Center & certifications",
    "Community & events",
    "Employer & recruiter partnerships",
    "General platform support",
  ],
};

export function getFeatureHref(sectionId: string, slug: string) {
  return getServiceHref(sectionId, slug);
}
