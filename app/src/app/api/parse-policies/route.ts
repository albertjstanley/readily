import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDF } from "@/lib/pdf";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const policies = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const text = await extractTextFromPDF(buffer);
        return { name: file.name, text };
      })
    );

    return NextResponse.json({ policies });
  } catch (e) {
    console.error("Error parsing policies:", e);
    return NextResponse.json(
      { error: "Failed to parse policy PDFs" },
      { status: 500 }
    );
  }
}
