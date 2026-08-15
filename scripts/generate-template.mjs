import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createBulkJobTemplateWorkbook } from "../src/features/employer-jobs/lib/excelTemplate.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "public", "templates");
const outputFile = path.join(outputDir, "SAP_Jobs_Finder_Bulk_Job_Template.xlsx");

async function generate() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const workbook = createBulkJobTemplateWorkbook();
  await workbook.xlsx.writeFile(outputFile);
  console.log(`[Success] Template v1.0 generated at ${outputFile}`);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
