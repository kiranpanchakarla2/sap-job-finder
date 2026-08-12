import type { ResumeCareerState } from "../types/resume.types";

/** Mock resume score — replace with real/AI score in a later sprint. */
export const MOCK_RESUME_SCORE = {
  score: 78,
  label: "Strong foundation",
  tip: "Add more SAP certifications and measurable achievements to improve your resume.",
} as const;

export const MOCK_RESUME_CAREER: ResumeCareerState = {
  resumes: [
    {
      id: "resume-1",
      fileName: "Kiran_Panchakarla_SAP_Resume.pdf",
      fileType: "PDF",
      fileSize: 2.4 * 1024 * 1024,
      uploadedAt: "2026-08-12T10:00:00.000Z",
      isCurrent: true,
      status: "Ready",
      storagePath: "mock/resume-1/resume.pdf",
      previewUrl: null,
    },
    {
      id: "resume-2",
      fileName: "Kiran_SAP_Resume_March_2026.pdf",
      fileType: "PDF",
      fileSize: 1.9 * 1024 * 1024,
      uploadedAt: "2026-03-18T09:00:00.000Z",
      isCurrent: false,
      status: "Archived",
      storagePath: "mock/resume-2/resume.pdf",
      previewUrl: null,
    },
  ],
  currentResumeId: "resume-1",
  experience: [
    {
      id: "exp-1",
      jobTitle: "SAP UI5 / Fiori Developer",
      company: "ABC Technologies",
      location: "Hyderabad, India",
      employmentType: "Full-time",
      startDate: "2023-01-01",
      endDate: "",
      currentlyWorking: true,
      description:
        "• Developed SAP Fiori applications for enterprise modules\n• Built reusable UI5 components shared across projects\n• Integrated OData services and improved application performance",
    },
    {
      id: "exp-2",
      jobTitle: "Frontend Developer",
      company: "XYZ Solutions",
      location: "Bengaluru, India",
      employmentType: "Full-time",
      startDate: "2020-06-01",
      endDate: "2022-12-31",
      currentlyWorking: false,
      description:
        "• Delivered responsive Angular and React interfaces\n• Collaborated with SAP consultants on hybrid UI solutions\n• Mentored junior developers on component design patterns",
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "Bachelor of Technology",
      fieldOfStudy: "Computer Science & Engineering",
      institution: "JNTU Hyderabad",
      location: "Hyderabad, India",
      startDate: "2016-06-01",
      endDate: "2020-05-31",
      grade: "8.2 CGPA",
    },
  ],
  careerHighlights: [
    {
      id: "hl-1",
      text: "Reduced application load time by 35% by optimizing Angular components.",
      order: 1,
    },
    {
      id: "hl-2",
      text: "Delivered 15+ SAP Fiori applications for enterprise clients.",
      order: 2,
    },
    {
      id: "hl-3",
      text: "Implemented reusable UI components used across 8 projects.",
      order: 3,
    },
  ],
  resumeScore: { ...MOCK_RESUME_SCORE },
};

export function cloneResumeCareerState(
  state: ResumeCareerState,
): ResumeCareerState {
  return structuredClone(state);
}
