import type {
  EmployerApplicantSummary,
  EmployerInterviewSummary,
} from "../types/dashboard.types";

export const mockRecentApplicants: EmployerApplicantSummary[] = [
  {
    id: "app_1",
    candidate: "Rahul Kumar",
    position: "SAP S/4HANA Finance Consultant",
    sapModule: "SAP S/4HANA",
    experience: "7 years",
    appliedAt: "Aug 8, 2026",
    status: "New",
  },
  {
    id: "app_2",
    candidate: "Ananya Iyer",
    position: "SAP BTP Developer",
    sapModule: "SAP BTP",
    experience: "5 years",
    appliedAt: "Aug 7, 2026",
    status: "Reviewing",
  },
  {
    id: "app_3",
    candidate: "Vikram Singh",
    position: "SAP MM Senior Consultant",
    sapModule: "SAP MM",
    experience: "8 years",
    appliedAt: "Aug 6, 2026",
    status: "Shortlisted",
  },
  {
    id: "app_4",
    candidate: "Sneha Reddy",
    position: "SAP S/4HANA Finance Consultant",
    sapModule: "SAP S/4HANA",
    experience: "6 years",
    appliedAt: "Aug 5, 2026",
    status: "New",
  },
];

export const mockUpcomingInterviews: EmployerInterviewSummary[] = [
  {
    id: "int_1",
    candidate: "Rahul Kumar",
    job: "SAP S/4HANA Finance Consultant",
    date: "Aug 12",
    time: "10:30 AM",
    type: "Video",
  },
  {
    id: "int_2",
    candidate: "Vikram Singh",
    job: "SAP MM Senior Consultant",
    date: "Aug 13",
    time: "2:00 PM",
    type: "Phone",
  },
  {
    id: "int_3",
    candidate: "Ananya Iyer",
    job: "SAP BTP Developer",
    date: "Aug 14",
    time: "11:00 AM",
    type: "Onsite",
  },
];

/** Toggle these to exercise empty states locally during development. */
export const DASHBOARD_EMPTY_OVERRIDES = {
  jobs: false,
  applicants: false,
  interviews: false,
};
