import type { CandidateMatchProfile } from "../types/job.types";

/** Local mock preferences for recommendations — no Supabase. */
export const MOCK_CANDIDATE_MATCH_PROFILE: CandidateMatchProfile = {
  skills: [
    "SAP Fiori",
    "SAP UI5",
    "Angular",
    "SAP BTP",
    "OData",
    "TypeScript",
    "React",
  ],
  sapModules: ["SAP Fiori", "SAP UI5", "SAP BTP", "SAP ABAP"],
  experienceYears: 5,
  preferredLocations: ["Hyderabad", "Bengaluru", "Remote"],
  workModes: ["Hybrid", "Remote"],
  preferredJobRoles: [
    "SAP UI5 Developer",
    "SAP Fiori Consultant",
    "Frontend Developer",
  ],
};
