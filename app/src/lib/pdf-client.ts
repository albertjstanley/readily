"use client";

import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

let workerSrcSet = false;

async function ensureWorker() {
  if (workerSrcSet) return;
  const pkg = await import("pdfjs-dist/package.json");
  GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pkg.version}/build/pdf.worker.min.mjs`;
  workerSrcSet = true;
}

export async function extractTextFromPDFClient(
  file: File
): Promise<string> {
  const pages = await extractPagesFromPDFClient(file);
  return pages.map((p) => p.text).join("\n");
}

export async function extractPagesFromPDFClient(
  file: File
): Promise<{ page: number; text: string }[]> {
  await ensureWorker();
  const buffer = await file.arrayBuffer();
  const doc = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: { page: number; text: string }[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = (content.items as Array<{ str?: string }>)
      .filter((item) => typeof item.str === "string")
      .map((item) => item.str)
      .join(" ");
    pages.push({ page: i, text });
  }

  return pages;
}
