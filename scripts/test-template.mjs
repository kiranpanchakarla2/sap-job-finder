import ExcelJS from "exceljs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatePath = path.resolve(
  __dirname,
  "../public/templates/SAP_Jobs_Finder_Bulk_Job_Template.xlsx"
);

const EXPECTED_COLUMNS = [
  "Job Title",
  "Job Description",
  "SAP Module",
  "Job Type",
  "Employment Type",
  "Experience Min",
  "Experience Max",
  "Location",
  "Work Mode",
  "Country",
  "Skills",
  "Salary Min",
  "Salary Max",
  "Currency",
  "Notice Period",
  "Education",
  "Number of Openings",
  "Application Deadline",
  "Contact Email",
];

const FORBIDDEN_FIELDS = [
  "Company ID",
  "Employer ID",
  "User ID",
  "Created By",
  "Company Name",
  "Organization ID",
  "Owner ID",
];

async function testTemplate() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);

  const worksheet = workbook.getWorksheet("Job Openings");
  if (!worksheet) {
    throw new Error("Worksheet 'Job Openings' not found!");
  }

  // Check columns count
  const headerRow = worksheet.getRow(1);
  const headers = [];
  headerRow.eachCell((cell) => {
    headers.push(String(cell.value).trim());
  });

  console.log(`Headers found (${headers.length}):`, headers);

  if (headers.length !== EXPECTED_COLUMNS.length) {
    throw new Error(
      `Expected ${EXPECTED_COLUMNS.length} columns, but found ${headers.length}`
    );
  }

  for (let i = 0; i < EXPECTED_COLUMNS.length; i++) {
    if (headers[i] !== EXPECTED_COLUMNS[i]) {
      throw new Error(
        `Column ${i + 1} mismatch: expected '${EXPECTED_COLUMNS[i]}', got '${headers[i]}'`
      );
    }
  }

  // Check forbidden fields
  for (const forbidden of FORBIDDEN_FIELDS) {
    if (
      headers.some((h) => h.toLowerCase() === forbidden.toLowerCase())
    ) {
      throw new Error(`Forbidden field '${forbidden}' found in template!`);
    }
  }

  // Check freeze pane
  const views = worksheet.views || [];
  const frozen = views.some(
    (v) => v.state === "frozen" && v.ySplit === 1
  );
  if (!frozen) {
    throw new Error("Top header row freeze pane not configured properly!");
  }

  // Check example row
  const row2 = worksheet.getRow(2);
  const row2Values = [];
  row2.eachCell((cell) => {
    row2Values.push(cell.value);
  });
  console.log("Example row values:", row2Values);

  if (row2.getCell(1).value !== "SAP MM Consultant") {
    throw new Error("Example row job title mismatch");
  }
  if (row2.getCell(3).value !== "MM") {
    throw new Error("Example row SAP Module mismatch");
  }
  if (Number(row2.getCell(6).value) !== 4) {
    throw new Error("Example row Experience Min mismatch");
  }
  if (Number(row2.getCell(7).value) !== 8) {
    throw new Error("Example row Experience Max mismatch");
  }
  if (row2.getCell(9).value !== "Hybrid") {
    throw new Error("Example row Work Mode mismatch");
  }
  if (row2.getCell(10).value !== "India") {
    throw new Error("Example row Country mismatch");
  }

  console.log("\n[PASS] All template validations passed successfully!");
}

testTemplate().catch((err) => {
  console.error(err);
  process.exit(1);
});
