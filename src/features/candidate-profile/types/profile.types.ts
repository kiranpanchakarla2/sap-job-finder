export type GenderOption =
  | "Male"
  | "Female"
  | "Non-binary"
  | "Prefer not to say"
  | "";

export type EmploymentStatus =
  | "Currently Employed"
  | "Notice Period"
  | "Immediately Available"
  | "Freelancer"
  | "";

export type WorkMode = "Remote" | "Hybrid" | "On-site";

export type EmploymentType = "Full-time" | "Contract" | "Part-time";

export type CareerLevel =
  | "Entry Level"
  | "Mid Level"
  | "Senior"
  | "Lead"
  | "Manager";

export type CertificationStatus = "Active" | "Expired" | "In Progress";

export type CandidateCertification = {
  id: string;
  name: string;
  issuingOrganization: string;
  certificationId: string;
  issueDate: string;
  expiryDate: string;
  status: CertificationStatus;
};

export type SapModuleExperience = {
  module: string;
  years: number;
};

export type CandidatePersonalInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: GenderOption;
  currentLocation: string;
  preferredLocation: string;
};

export type CandidateCareerInfo = {
  currentJobTitle: string;
  currentCompany: string;
  totalExperience: string;
  relevantSapExperience: string;
  noticePeriod: string;
  expectedSalary: string;
  currentSalary: string;
  employmentStatus: EmploymentStatus;
};

export type CandidateSapExpertise = {
  modules: string[];
  technicalSkills: string[];
  moduleExperience: SapModuleExperience[];
};

export type CandidateJobPreferences = {
  preferredJobRoles: string[];
  preferredSapModules: string[];
  preferredLocations: string[];
  workModes: WorkMode[];
  employmentTypes: EmploymentType[];
  preferredSalaryRange: string;
  careerLevel: CareerLevel | "";
};

export type CandidateOpenToWork = {
  enabled: boolean;
  preferredJobRoles: string[];
  preferredLocations: string[];
  preferredWorkModes: WorkMode[];
  availability: string;
};

export type CandidateProfileForm = {
  photoUrl: string | null;
  personal: CandidatePersonalInfo;
  professionalSummary: string;
  career: CandidateCareerInfo;
  sapExpertise: CandidateSapExpertise;
  certifications: CandidateCertification[];
  preferences: CandidateJobPreferences;
  openToWork: CandidateOpenToWork;
  /** Mock flag until Resume sprint / Supabase */
  hasResume: boolean;
};

export type ProfileCompletionCategoryId =
  | "personal"
  | "summary"
  | "career"
  | "sapSkills"
  | "certifications"
  | "preferences"
  | "resume";

export type ProfileCompletionCategory = {
  id: ProfileCompletionCategoryId;
  label: string;
  complete: boolean;
};

export type ProfileCompletionResult = {
  percent: number;
  completedCount: number;
  totalCount: number;
  categories: ProfileCompletionCategory[];
};

export type ProfileFieldErrors = Partial<{
  firstName: string;
  lastName: string;
  currentJobTitle: string;
  currentLocation: string;
}>;
