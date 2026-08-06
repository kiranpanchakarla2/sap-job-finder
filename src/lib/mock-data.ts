export type MockJob = {
  id: string;
  title: string;
  company: string;
  companyId: string;
  logo: string;
  location: string;
  salary: string;
  experience: string;
  employmentType: "FULL-TIME" | "PART-TIME" | "INTERNSHIP" | "CONTRACT";
  workMode: "Remote" | "Hybrid" | "Onsite";
  module: string;
  skills: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  featured?: boolean;
  highlight?: boolean;
  postedAt: string;
};

export type MockCompany = {
  id: string;
  name: string;
  logo: string;
  logoColor: string;
  description: string;
  website: string;
  location: string;
  openRoles: number;
  featured?: boolean;
};

export const mockCompanies: MockCompany[] = [
  {
    id: "infosys",
    name: "Infosys",
    logo: "I",
    logoColor: "#2563EB",
    description: "Global digital services and consulting leader hiring across SAP modules.",
    website: "https://www.infosys.com",
    location: "Bengaluru, India",
    openRoles: 12,
    featured: true,
  },
  {
    id: "tcs",
    name: "TCS",
    logo: "T",
    logoColor: "#0D9488",
    description: "Enterprise transformation partner with deep SAP practice.",
    website: "https://www.tcs.com",
    location: "Mumbai, India",
    openRoles: 18,
    featured: true,
  },
  {
    id: "accenture",
    name: "Accenture",
    logo: "A",
    logoColor: "#7C3AED",
    description: "Strategy and technology consulting with SAP S/4HANA programs.",
    website: "https://www.accenture.com",
    location: "Hyderabad, India",
    openRoles: 9,
    featured: true,
  },
  {
    id: "deloitte",
    name: "Deloitte",
    logo: "D",
    logoColor: "#059669",
    description: "Advisory and implementation services across SAP Finance and Logistics.",
    website: "https://www.deloitte.com",
    location: "Gurugram, India",
    openRoles: 7,
  },
  {
    id: "capgemini",
    name: "Capgemini",
    logo: "C",
    logoColor: "#EA580C",
    description: "SAP S/4HANA and cloud transformation programs for global enterprises.",
    website: "https://www.capgemini.com",
    location: "Pune, India",
    openRoles: 11,
    featured: true,
  },
  {
    id: "wipro",
    name: "Wipro",
    logo: "W",
    logoColor: "#6366F1",
    description: "End-to-end SAP implementation and managed services partner.",
    website: "https://www.wipro.com",
    location: "Chennai, India",
    openRoles: 14,
  },
];

export const mockJobs: MockJob[] = [
  {
    id: "sap-commerce-dev",
    title: "SAP Commerce Developer",
    company: "Infosys",
    companyId: "infosys",
    logo: "I",
    location: "Hyderabad, India",
    salary: "₹20,00,000 - ₹28,00,000",
    experience: "5 Years",
    employmentType: "FULL-TIME",
    workMode: "Remote",
    module: "commerce",
    skills: ["SAP Commerce", "Java", "Spring", "Spartacus"],
    description:
      "Build and extend SAP Commerce Cloud storefronts and integrations for enterprise retail clients.",
    requirements: [
      "5+ years SAP Commerce / Hybris experience",
      "Strong Java and Spring skills",
      "Experience with Spartacus or composable storefront",
    ],
    benefits: ["Remote-first", "Health insurance", "Learning budget"],
    featured: true,
    highlight: true,
    postedAt: "2 days ago",
  },
  {
    id: "abap-specialist",
    title: "SAP ABAP Developer",
    company: "TCS",
    companyId: "tcs",
    logo: "T",
    location: "Bengaluru, India",
    salary: "₹16,00,000 - ₹22,00,000",
    experience: "4 Years",
    employmentType: "FULL-TIME",
    workMode: "Hybrid",
    module: "abap",
    skills: ["ABAP", "OOABAP", "CDS", "RAP"],
    description: "Design and deliver ABAP RAP applications on S/4HANA.",
    requirements: ["Strong OOABAP", "CDS views", "RAP experience preferred"],
    benefits: ["Hybrid office", "Certification support"],
    featured: true,
    highlight: true,
    postedAt: "3 days ago",
  },
  {
    id: "fiori-consultant",
    title: "SAP Fiori Consultant",
    company: "Accenture",
    companyId: "accenture",
    logo: "A",
    location: "Pune, India",
    salary: "₹18,00,000 - ₹25,00,000",
    experience: "6 Years",
    employmentType: "FULL-TIME",
    workMode: "Onsite",
    module: "fiori",
    skills: ["Fiori", "UI5", "OData", "BTP"],
    description: "Lead Fiori UX delivery and extensions on BTP.",
    requirements: ["UI5 expertise", "OData services", "Design thinking"],
    benefits: ["Onsite client exposure", "Global projects"],
    featured: true,
    postedAt: "1 week ago",
  },
  {
    id: "btp-architect",
    title: "SAP BTP Architect",
    company: "Deloitte",
    companyId: "deloitte",
    logo: "D",
    location: "Gurugram, India",
    salary: "₹28,00,000 - ₹40,00,000",
    experience: "8 Years",
    employmentType: "FULL-TIME",
    workMode: "Hybrid",
    module: "btp",
    skills: ["BTP", "CAP", "Integration Suite", "Cloud Foundry"],
    description: "Define BTP target architectures and integration patterns.",
    requirements: ["Enterprise architecture", "CAP / Node or Java", "Integration Suite"],
    benefits: ["Leadership track", "Flexible hybrid"],
    featured: true,
    postedAt: "5 days ago",
  },
  {
    id: "mm-consultant",
    title: "SAP MM Consultant",
    company: "Infosys",
    companyId: "infosys",
    logo: "I",
    location: "Chennai, India",
    salary: "₹14,00,000 - ₹20,00,000",
    experience: "3 Years",
    employmentType: "FULL-TIME",
    workMode: "Hybrid",
    module: "mm",
    skills: ["MM", "S/4HANA", "Procurement"],
    description: "Implement and support Materials Management processes on S/4HANA.",
    requirements: ["MM configuration", "Procurement cycles", "Client workshops"],
    benefits: ["Training programs", "Relocation support"],
    featured: true,
    postedAt: "4 days ago",
  },
  {
    id: "fico-lead",
    title: "SAP FICO Lead",
    company: "Accenture",
    companyId: "accenture",
    logo: "A",
    location: "Mumbai, India",
    salary: "₹24,00,000 - ₹32,00,000",
    experience: "7 Years",
    employmentType: "FULL-TIME",
    workMode: "Remote",
    module: "fico",
    skills: ["FICO", "S/4HANA Finance", "Controlling"],
    description: "Lead Finance workstreams for S/4HANA transformations.",
    requirements: ["Deep FI/CO", "S/4 Finance", "Stakeholder management"],
    benefits: ["Remote", "Performance bonus"],
    featured: true,
    postedAt: "6 days ago",
  },
  {
    id: "basis-admin",
    title: "SAP Basis Administrator",
    company: "Wipro",
    companyId: "wipro",
    logo: "W",
    location: "Bengaluru, India",
    salary: "₹12,00,000 - ₹18,00,000",
    experience: "4 Years",
    employmentType: "FULL-TIME",
    workMode: "Hybrid",
    module: "basis",
    skills: ["Basis", "HANA", "Security", "Monitoring"],
    description: "Manage SAP landscape administration, patching, and HANA operations.",
    requirements: ["SAP Basis admin", "HANA experience", "Incident management"],
    benefits: ["Shift allowance", "Certification path"],
    featured: true,
    postedAt: "2 days ago",
  },
  {
    id: "sd-consultant",
    title: "SAP SD Consultant",
    company: "Capgemini",
    companyId: "capgemini",
    logo: "C",
    location: "Hyderabad, India",
    salary: "₹15,00,000 - ₹21,00,000",
    experience: "5 Years",
    employmentType: "FULL-TIME",
    workMode: "Onsite",
    module: "sd",
    skills: ["SD", "S/4HANA", "Order-to-Cash"],
    description: "Configure and deliver Sales & Distribution processes on S/4HANA.",
    requirements: ["SD configuration", "OTC cycles", "Integration knowledge"],
    benefits: ["Client travel", "Health cover"],
    featured: true,
    highlight: true,
    postedAt: "3 days ago",
  },
  {
    id: "hana-developer",
    title: "SAP HANA Developer",
    company: "TCS",
    companyId: "tcs",
    logo: "T",
    location: "Pune, India",
    salary: "₹18,00,000 - ₹26,00,000",
    experience: "5 Years",
    employmentType: "FULL-TIME",
    workMode: "Remote",
    module: "s4hana",
    skills: ["HANA", "CDS", "AMD", "Native SQL"],
    description: "Build high-performance HANA models and CDS views for analytics.",
    requirements: ["HANA modeling", "CDS", "Performance tuning"],
    benefits: ["Remote-first", "Upskilling budget"],
    featured: true,
    postedAt: "1 week ago",
  },
  {
    id: "successfactors-consultant",
    title: "SAP SuccessFactors Consultant",
    company: "Deloitte",
    companyId: "deloitte",
    logo: "D",
    location: "Gurugram, India",
    salary: "₹16,00,000 - ₹24,00,000",
    experience: "4 Years",
    employmentType: "FULL-TIME",
    workMode: "Hybrid",
    module: "successfactors",
    skills: ["Employee Central", "Recruiting", "Integration"],
    description: "Implement SuccessFactors modules and HR cloud integrations.",
    requirements: ["EC configuration", "Integration experience", "Workshops"],
    benefits: ["Hybrid work", "Global delivery"],
    featured: true,
    postedAt: "4 days ago",
  },
  {
    id: "bw-analyst",
    title: "SAP BW / BI Analyst",
    company: "Infosys",
    companyId: "infosys",
    logo: "I",
    location: "Chennai, India",
    salary: "₹13,00,000 - ₹19,00,000",
    experience: "3 Years",
    employmentType: "PART-TIME",
    workMode: "Remote",
    module: "bw",
    skills: ["BW", "BEx", "Analytics", "Data modeling"],
    description: "Design BW data models and reporting for SAP analytics programs.",
    requirements: ["BW modeling", "Reporting", "Data extraction"],
    benefits: ["Flexible hours", "Remote"],
    featured: true,
    postedAt: "5 days ago",
  },
  {
    id: "sap-pp-intern",
    title: "SAP PP Intern",
    company: "Wipro",
    companyId: "wipro",
    logo: "W",
    location: "Bengaluru, India",
    salary: "₹3,00,000 - ₹5,00,000",
    experience: "0 Years",
    employmentType: "INTERNSHIP",
    workMode: "Onsite",
    module: "pp",
    skills: ["PP", "MRP", "Production Planning"],
    description: "Support production planning workstreams under senior consultants.",
    requirements: ["SAP PP basics", "Academic projects", "Eagerness to learn"],
    benefits: ["Mentorship", "PPO opportunity"],
    featured: true,
    postedAt: "1 day ago",
  },
  {
    id: "ariba-specialist",
    title: "SAP Ariba Specialist",
    company: "Capgemini",
    companyId: "capgemini",
    logo: "C",
    location: "Mumbai, India",
    salary: "₹17,00,000 - ₹23,00,000",
    experience: "5 Years",
    employmentType: "CONTRACT",
    workMode: "Hybrid",
    module: "ariba",
    skills: ["Ariba", "Sourcing", "Procurement"],
    description: "Deliver Ariba sourcing and procurement cloud implementations.",
    requirements: ["Ariba config", "Procurement domain", "Client facing"],
    benefits: ["Contract extension", "Certification support"],
    featured: true,
    postedAt: "6 days ago",
  },
];

export function getJobById(id: string) {
  return mockJobs.find((j) => j.id === id);
}

export function getCompanyById(id: string) {
  return mockCompanies.find((c) => c.id === id);
}

export function filterJobs(params: {
  q?: string;
  location?: string;
  module?: string;
  workMode?: string;
}) {
  const q = params.q?.toLowerCase().trim();
  const location = params.location?.toLowerCase().trim();
  const module = params.module?.toLowerCase().trim();
  const workMode = params.workMode?.toLowerCase().trim();

  return mockJobs.filter((job) => {
    if (q) {
      const hay = `${job.title} ${job.company} ${job.skills.join(" ")} ${job.module}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (location && !job.location.toLowerCase().includes(location)) return false;
    if (module && job.module !== module) return false;
    if (workMode && job.workMode.toLowerCase() !== workMode) return false;
    return true;
  });
}
