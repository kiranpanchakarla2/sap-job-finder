import type { DiscoveryCompany } from "../types/job.types";

export const MOCK_DISCOVERY_COMPANIES: DiscoveryCompany[] = [
  {
    id: "infosys",
    name: "Infosys",
    logo: "I",
    logoColor: "#2563EB",
    description:
      "Global digital services and consulting leader hiring across SAP modules for enterprise transformation programs.",
    industry: "IT Services & Consulting",
    companySize: "250,000+ employees",
    location: "Bengaluru, India",
    website: "https://www.infosys.com",
  },
  {
    id: "tcs",
    name: "TCS",
    logo: "T",
    logoColor: "#0D9488",
    description:
      "Enterprise transformation partner with a deep SAP practice spanning S/4HANA, ABAP, and cloud integrations.",
    industry: "IT Services",
    companySize: "600,000+ employees",
    location: "Mumbai, India",
    website: "https://www.tcs.com",
  },
  {
    id: "accenture",
    name: "Accenture",
    logo: "A",
    logoColor: "#7C3AED",
    description:
      "Strategy and technology consulting firm delivering large-scale SAP S/4HANA and BTP programs worldwide.",
    industry: "Consulting",
    companySize: "700,000+ employees",
    location: "Hyderabad, India",
    website: "https://www.accenture.com",
  },
  {
    id: "deloitte",
    name: "Deloitte",
    logo: "D",
    logoColor: "#059669",
    description:
      "Advisory and implementation services across SAP Finance, Logistics, and SuccessFactors.",
    industry: "Professional Services",
    companySize: "450,000+ employees",
    location: "Gurugram, India",
    website: "https://www.deloitte.com",
  },
  {
    id: "capgemini",
    name: "Capgemini",
    logo: "C",
    logoColor: "#EA580C",
    description:
      "SAP S/4HANA and cloud transformation programs for global enterprises across industries.",
    industry: "IT Consulting",
    companySize: "340,000+ employees",
    location: "Pune, India",
    website: "https://www.capgemini.com",
  },
  {
    id: "wipro",
    name: "Wipro",
    logo: "W",
    logoColor: "#6366F1",
    description:
      "End-to-end SAP implementation and managed services partner with strong India delivery centers.",
    industry: "IT Services",
    companySize: "250,000+ employees",
    location: "Chennai, India",
    website: "https://www.wipro.com",
  },
  {
    id: "techm",
    name: "Tech Mahindra",
    logo: "TM",
    logoColor: "#DC2626",
    description:
      "Digital transformation company with specialized SAP ABAP, Fiori, and integration practices.",
    industry: "IT Services",
    companySize: "150,000+ employees",
    location: "Hyderabad, India",
  },
  {
    id: "lti",
    name: "LTIMindtree",
    logo: "L",
    logoColor: "#0891B2",
    description:
      "Technology consulting firm focused on SAP cloud migrations, BTP, and industry solutions.",
    industry: "IT Consulting",
    companySize: "80,000+ employees",
    location: "Mumbai, India",
  },
];

export function getDiscoveryCompanyById(id: string) {
  return MOCK_DISCOVERY_COMPANIES.find((c) => c.id === id);
}
