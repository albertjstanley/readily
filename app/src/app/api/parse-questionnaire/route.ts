import { NextRequest, NextResponse } from "next/server";
import { extractQuestions } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { text, pages } = await req.json();

    if (pages && pages.length > 0) {
      const questions = await extractQuestions(
        pages.map((p: { page: number; text: string }) => p.text).join("\n")
      );
      return NextResponse.json({ questions });
    }

    if (!text) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    const questions = await extractQuestions(text);
    return NextResponse.json({ questions });
  } catch (e) {
    console.error("Error parsing questionnaire:", e);
    return NextResponse.json(
      { error: "Failed to parse questionnaire" },
      { status: 500 }
    );
  }
}
