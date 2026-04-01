import { NextRequest, NextResponse } from "next/server";
import { analyzeCompliance } from "@/lib/gemini";

const MAX_POLICY_CHARS = 80000;

function selectRelevantPolicies(
  questions: { number: number; text: string; reference: string }[],
  policyTexts: { name: string; text: string }[]
): { name: string; text: string }[] {
  const keywords = questions
    .flatMap((q) => q.text.toLowerCase().split(/\s+/))
    .filter((w) => w.length > 4);

  const scored = policyTexts.map((p) => {
    const lower = p.text.toLowerCase();
    const score = keywords.filter((k) => lower.includes(k)).length;
    return { ...p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const selected: { name: string; text: string }[] = [];
  let totalChars = 0;

  for (const p of scored) {
    if (p.score === 0) continue;
    if (totalChars + p.text.length > MAX_POLICY_CHARS) continue;
    selected.push({ name: p.name, text: p.text });
    totalChars += p.text.length;
  }

  if (selected.length === 0 && scored.length > 0) {
    const top = scored[0];
    selected.push({
      name: top.name,
      text: top.text.slice(0, MAX_POLICY_CHARS),
    });
  }

  return selected;
}

export async function POST(req: NextRequest) {
  try {
    const { questions, policyTexts } = await req.json();

    if (!questions?.length || !policyTexts?.length) {
      return NextResponse.json(
        { error: "Questions and policy texts are required" },
        { status: 400 }
      );
    }

    const relevant = selectRelevantPolicies(questions, policyTexts);
    const results = await analyzeCompliance(questions, relevant);

    return NextResponse.json({ results });
  } catch (e) {
    console.error("Error analyzing compliance:", e);
    return NextResponse.json(
      { error: "Compliance analysis failed" },
      { status: 500 }
    );
  }
}
