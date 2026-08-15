export type AlertFrequency = "instant" | "daily" | "weekly";

export type AlertStatus = "active" | "paused";

export type JobAlert = {
  id: string;
  name: string;
  keywords: string[];
  sapModules: string[];
  location: string;
  experience: string;
  workMode: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  frequency: AlertFrequency;
  status: AlertStatus;
  createdAt: string;
  updatedAt: string;
  lastMatchedCount?: number;
};

export type JobAlertInput = {
  name: string;
  keywords: string[];
  sapModules: string[];
  location: string;
  experience: string;
  workMode: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  frequency: AlertFrequency;
};

export type JobAlertFormErrors = {
  name?: string;
  criteria?: string;
  salary?: string;
  experience?: string;
};
