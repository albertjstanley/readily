import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDF } from "@/lib/pdf";
import { extractQuestions } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromPDF(buffer);
    const questions = await extractQuestions(text);

    return NextResponse.json({ questions });
  } catch (e) {
    console.error("Error parsing questionnaire:", e);
    return NextResponse.json(
      { error: "Failed to parse questionnaire PDF" },
      { status: 500 }
    );
  }
}
