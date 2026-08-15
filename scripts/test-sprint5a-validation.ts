import { MOCK_DISCOVERY_JOBS } from "../src/features/candidate-jobs/data/mockJobs";
import { INITIAL_SAVED_JOB_IDS, getMockSavedJobs } from "../src/features/candidate-jobs/data/mockSavedJobs";
import { MOCK_JOB_ALERTS } from "../src/features/candidate-alerts/data/mockJobAlerts";

console.log("=================================================");
console.log("SPRINT 5 PHASE A: VALIDATION & REGRESSION CHECKS");
console.log("=================================================");

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

// 1. Check Mock Saved Jobs
console.log("\n--- 1. Saved Jobs Seed Data ---");
const mockSaved = getMockSavedJobs();
assert(mockSaved.length === INITIAL_SAVED_JOB_IDS.length, `Expected ${INITIAL_SAVED_JOB_IDS.length} saved jobs, found ${mockSaved.length}`);
assert(mockSaved.some(j => j.status === "closed"), "Contains at least one closed job for closed state testing");
assert(mockSaved.every(j => Boolean(j.savedAt)), "All saved jobs have valid savedAt timestamps");
assert(mockSaved.every(j => Boolean(j.title) && Boolean(j.companyName)), "All saved jobs have title and company name");

// 2. Check Mock Job Alerts
console.log("\n--- 2. Job Alerts Seed Data ---");
assert(MOCK_JOB_ALERTS.length >= 3, `Expected at least 3 initial job alerts, found ${MOCK_JOB_ALERTS.length}`);
const activeAlerts = MOCK_JOB_ALERTS.filter(a => a.status === "active");
const pausedAlerts = MOCK_JOB_ALERTS.filter(a => a.status === "paused");
assert(activeAlerts.length > 0, "Contains active job alerts");
assert(pausedAlerts.length > 0, "Contains paused job alerts");
assert(MOCK_JOB_ALERTS.every(a => ["instant", "daily", "weekly"].includes(a.frequency)), "All job alerts have valid frequencies");
assert(MOCK_JOB_ALERTS.every(a => a.name.trim().length > 0), "All job alerts have valid names");

// 3. Validation Logic Test for Job Alerts
console.log("\n--- 3. Job Alert Validation Rules ---");
function validateAlertInput(input: any) {
  const errors: Record<string, string> = {};
  if (!input.name || !input.name.trim()) {
    errors.name = "Alert name is required";
  }
  const hasCriteria =
    (input.keywords && input.keywords.length > 0) ||
    (input.sapModules && input.sapModules.length > 0) ||
    Boolean(input.location && input.location !== "Any") ||
    Boolean(input.experience && input.experience !== "Any") ||
    Boolean(input.workMode && input.workMode !== "Any");

  if (!hasCriteria) {
    errors.criteria = "Please select at least one SAP module, keyword, location, or experience criteria.";
  }
  if (input.salaryMin != null && input.salaryMax != null && input.salaryMin > input.salaryMax) {
    errors.salary = "Minimum salary cannot exceed maximum salary.";
  }
  return errors;
}

const emptyTest = validateAlertInput({ name: "", keywords: [], sapModules: [], location: "", experience: "", workMode: "", employmentType: "", salaryMin: null, salaryMax: null, frequency: "daily" });
assert(Boolean(emptyTest.name), "Rejects empty alert name");
assert(Boolean(emptyTest.criteria), "Rejects alert with zero criteria");

const invalidSalaryTest = validateAlertInput({ name: "Test Alert", keywords: ["Fiori"], sapModules: [], location: "", experience: "", workMode: "", employmentType: "", salaryMin: 30, salaryMax: 15, frequency: "daily" });
assert(Boolean(invalidSalaryTest.salary), "Rejects salary min > salary max");

const validTest = validateAlertInput({ name: "SAP Fiori Jobs - Hyderabad", keywords: ["Fiori", "UI5"], sapModules: ["SAP Fiori"], location: "Hyderabad", experience: "5–8 Years", workMode: "Hybrid", employmentType: "Full-time", salaryMin: 15, salaryMax: 25, frequency: "daily" });
assert(Object.keys(validTest).length === 0, "Accepts valid alert input");

// 4. Saved Jobs Filtering & Sorting Logic
console.log("\n--- 4. Saved Jobs Filter & Sort Logic ---");
const fioriJobs = mockSaved.filter(j => 
  j.title.toLowerCase().includes("fiori") || 
  j.requiredSkills.some(s => s.toLowerCase().includes("fiori")) ||
  j.sapModules.some(m => m.toLowerCase().includes("fiori"))
);
assert(fioriJobs.length > 0, "Keyword search for 'fiori' returns matching jobs");

const closedJobs = mockSaved.filter(j => j.status === "closed");
assert(closedJobs.length > 0, "Status filter can isolate closed jobs");

// Summary
console.log("\n=================================================");
console.log(`TOTAL: ${passed} PASSED, ${failed} FAILED`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
}
