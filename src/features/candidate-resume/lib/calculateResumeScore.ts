import type { ResumeScoreInsight } from "../types/resume.types";

export type ResumeScoreInput = {
  hasResume: boolean;
  experienceCount: number;
  educationCount: number;
  skillsCount: number;
  certificationsCount: number;
  highlightsCount?: number;
};

/**
 * Dynamically computes a candidate's resume score (0-100) and actionable improvement tip
 * based on real uploaded documents, work experience, education, skills, and certifications.
 */
export function calculateResumeScore(input: ResumeScoreInput): ResumeScoreInsight {
  let score = 0;
  const missing: string[] = [];

  // Resume document (+30 points)
  if (input.hasResume) {
    score += 30;
  } else {
    missing.push("Upload your latest resume PDF or DOCX");
  }

  // Work experience (+25 points)
  if (input.experienceCount >= 2) {
    score += 25;
  } else if (input.experienceCount === 1) {
    score += 15;
    missing.push("Add more work history details");
  } else {
    missing.push("Add your work experience");
  }

  // SAP and technical skills (+20 points)
  if (input.skillsCount >= 5) {
    score += 20;
  } else if (input.skillsCount >= 1) {
    score += 10;
    missing.push("Add at least 5 SAP and technical skills");
  } else {
    missing.push("Add your key SAP skills");
  }

  // Education (+15 points)
  if (input.educationCount >= 1) {
    score += 15;
  } else {
    missing.push("Add your degree or education history");
  }

  // Certifications or Career Highlights (+10 points)
  if (input.certificationsCount >= 1 || (input.highlightsCount && input.highlightsCount >= 1)) {
    score += 10;
  } else {
    missing.push("Add SAP certifications or key career achievements");
  }

  score = Math.min(100, Math.max(0, score));

  let label = "Needs attention";
  if (score >= 90) label = "Exceptional";
  else if (score >= 75) label = "Strong profile";
  else if (score >= 50) label = "Good start";
  else if (score >= 25) label = "Incomplete";

  let tip = "Your resume and profile are complete and ready for top SAP recruiters.";
  if (missing.length > 0) {
    tip = `${missing[0]} to increase your resume score.`;
  }

  return {
    score,
    label,
    tip,
  };
}
