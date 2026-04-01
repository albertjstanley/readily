import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs";
import path from "path";

const POLICIES_DIR = path.resolve("../Public Policies");
const OUTPUT_FILE = path.resolve("src/lib/policy-index.json");

async function extractPDF(filePath) {
  const buf = fs.readFileSync(filePath);
  const uint8 = new Uint8Array(buf);
  const doc = await getDocument({ data: uint8 }).promise;
  const pages = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .filter((item) => "str" in item)
      .map((item) => item.str)
      .join(" ");
    pages.push({ page: i, text });
  }

  return pages;
}

async function main() {
  const categories = fs
    .readdirSync(POLICIES_DIR)
    .filter((d) => fs.statSync(path.join(POLICIES_DIR, d)).isDirectory());

  const index = [];
  let total = 0;
  let errors = 0;

  for (const category of categories) {
    const catDir = path.join(POLICIES_DIR, category);
    const files = fs.readdirSync(catDir).filter((f) => f.endsWith(".pdf"));

    for (const file of files) {
      try {
        const pages = await extractPDF(path.join(catDir, file));
        index.push({ name: file, category, pages });
        total++;
        if (total % 20 === 0) console.log(`  Processed ${total} PDFs...`);
      } catch (e) {
        errors++;
        console.error(`  Error: ${file}: ${e.message}`);
      }
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index));
  const sizeMB = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(1);
  console.log(`\nDone: ${total} PDFs extracted, ${errors} errors`);
  console.log(`Output: ${OUTPUT_FILE} (${sizeMB} MB)`);
}

main();
