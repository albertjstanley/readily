// Minimal polyfills for pdfjs-dist's rendering code.
// We only use text extraction, but the module unconditionally
// references DOMMatrix/Path2D at the top level during load.
if (typeof globalThis.DOMMatrix === "undefined") {
  // @ts-expect-error stub for server-side text extraction
  globalThis.DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    constructor(_init?: unknown) {}
    invertSelf() { return this; }
    multiplySelf() { return this; }
    preMultiplySelf() { return this; }
    translate() { return this; }
    scale() { return this; }
  };
}
if (typeof globalThis.Path2D === "undefined") {
  // @ts-expect-error stub
  globalThis.Path2D = class Path2D {
    addPath() {}
  };
}
if (typeof globalThis.ImageData === "undefined") {
  // @ts-expect-error stub
  globalThis.ImageData = class ImageData {
    width = 0; height = 0; data = new Uint8ClampedArray();
    constructor(w: number, h: number) { this.width = w; this.height = h; }
  };
}

import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

GlobalWorkerOptions.workerSrc = "";

export interface PageContent {
  page: number;
  text: string;
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pages = await extractPagesFromPDF(buffer);
  return pages.map((p) => p.text).join("\n");
}

export async function extractPagesFromPDF(
  buffer: Buffer
): Promise<PageContent[]> {
  const uint8 = new Uint8Array(buffer);
  const doc = await getDocument({
    data: uint8,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;
  const pages: PageContent[] = [];

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
