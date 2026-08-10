import type { CompanyProfile } from "../types/company.types";

/**
 * Optional seed profile for local demos.
 * Sprint 2 uses localStorage as the active source; this seed is unused unless
 * explicitly loaded by the mock service for empty-state testing.
 */
export const mockCompanyProfileSeed: CompanyProfile = {
  id: "company_demo_1",
  employerId: "demo",
  companyName: "Aether SAP Consulting",
  logoUrl: null,
  website: "https://aethersap.example",
  industry: "Consulting",
  companySize: "51-200",
  country: "India",
  state: "Karnataka",
  city: "Bengaluru",
  address: "12th Floor, Prestige Tech Park",
  about:
    "Aether SAP Consulting helps enterprises modernize finance, supply chain, and HR processes with SAP S/4HANA and SuccessFactors specialists.",
  recruiterName: "Priya Sharma",
  designation: "Talent Acquisition Lead",
  workEmail: "priya@aethersap.example",
  phone: "+91 98765 43210",
  setupComplete: true,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-08T10:00:00.000Z",
};
