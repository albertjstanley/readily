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
  await ensureWorker();
  const buffer = await file.arrayBuffer();
  const doc = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const parts: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = (content.items as Array<{ str?: string }>)
      .filter((item) => typeof item.str === "string")
      .map((item) => item.str)
      .join(" ");
    parts.push(text);
  }

  return parts.join("\n");
}
