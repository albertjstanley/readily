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
