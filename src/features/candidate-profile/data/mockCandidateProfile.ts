import type { CandidateProfileForm } from "../types/profile.types";

/**
 * Local mock candidate profile for Sprint 1 UI.
 * Replace with Supabase-backed data in Phase 2 — keep this shape stable.
 */
export const MOCK_CANDIDATE_PROFILE: CandidateProfileForm = {
  photoUrl: null,
  personal: {
    firstName: "Kiran",
    lastName: "Panchakarla",
    email: "kiran.candidate@example.com",
    phone: "+91 •••••• 4821",
    dateOfBirth: "1996-04-12",
    gender: "Male",
    currentLocation: "Hyderabad, India",
    preferredLocation: "Hyderabad / Remote",
  },
  professionalSummary:
    "SAP professional with experience in enterprise application development, UI technologies and SAP ecosystem solutions.",
  career: {
    currentJobTitle: "SAP UI / Frontend Developer",
    currentCompany: "Enterprise Digital Solutions",
    totalExperience: "5 years",
    relevantSapExperience: "4 years",
    noticePeriod: "30 Days",
    expectedSalary: "₹18–24 LPA",
    currentSalary: "₹16 LPA",
    employmentStatus: "Currently Employed",
  },
  sapExpertise: {
    modules: ["SAP Fiori", "SAP UI5", "SAP BTP", "SAP ABAP"],
    technicalSkills: [
      "React",
      "TypeScript",
      "JavaScript",
      "SAP UI5",
      "Fiori",
      "OData",
      "REST APIs",
      "HTML",
      "CSS",
      "Git",
    ],
    moduleExperience: [
      { module: "SAP Fiori", years: 4 },
      { module: "SAP UI5", years: 4 },
      { module: "SAP BTP", years: 2 },
      { module: "SAP ABAP", years: 1 },
    ],
  },
  certifications: [
    {
      id: "cert-1",
      name: "SAP Certified Development Associate",
      issuingOrganization: "SAP SE",
      certificationId: "C_FIORI_2405",
      issueDate: "2024-06-15",
      expiryDate: "",
      status: "Active",
    },
    {
      id: "cert-2",
      name: "SAP Certified Application Associate",
      issuingOrganization: "SAP SE",
      certificationId: "C_ACTIVATE_2404",
      issueDate: "2023-11-02",
      expiryDate: "2026-11-02",
      status: "Active",
    },
  ],
  preferences: {
    preferredJobRoles: [
      "SAP UI5 Developer",
      "SAP Fiori Consultant",
      "Frontend Developer",
    ],
    preferredSapModules: ["SAP Fiori", "SAP UI5", "SAP BTP"],
    preferredLocations: ["Hyderabad", "Bangalore", "Remote"],
    workModes: ["Hybrid", "Remote"],
    employmentTypes: ["Full-time"],
    preferredSalaryRange: "₹18–24 LPA",
    careerLevel: "Mid Level",
  },
  openToWork: {
    enabled: true,
    preferredJobRoles: ["SAP UI5 Developer", "SAP Fiori Consultant"],
    preferredLocations: ["Hyderabad", "Remote"],
    preferredWorkModes: ["Hybrid", "Remote"],
    availability: "Available in 30 days",
  },
  hasResume: true,
};

export function cloneCandidateProfile(
  profile: CandidateProfileForm,
): CandidateProfileForm {
  return structuredClone(profile);
}
