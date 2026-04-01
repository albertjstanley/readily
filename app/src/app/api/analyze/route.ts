import { NextRequest, NextResponse } from "next/server";
import { analyzeCompliance } from "@/lib/gemini";
import policyIndex from "@/lib/policy-index.json";

const MAX_POLICY_CHARS = 80000;

interface PolicyEntry {
  name: string;
  category: string;
  pages: { page: number; text: string }[];
}

const allPolicies = (policyIndex as PolicyEntry[]).map((p) => ({
  name: p.name,
  text: p.pages.map((pg) => `[Page ${pg.page}] ${pg.text}`).join("\n"),
}));

interface SelectionResult {
  policies: { name: string; text: string }[];
  keywords: string[];
  totalPoliciesScanned: number;
}

function selectRelevantPolicies(
  questions: { number: number; text: string; reference: string }[]
): SelectionResult {
  const stopWords = new Set([
    "about", "after", "which", "would", "could", "should", "their",
    "there", "these", "those", "under", "other", "where", "while",
    "being", "every", "above", "below", "between", "through", "during",
    "before", "state", "states", "does",
  ]);

  const keywords = [
    ...new Set(
      questions
        .flatMap((q) =>
          `${q.text} ${q.reference}`.toLowerCase().split(/\s+/)
        )
        .map((w) => w.replace(/[^a-z0-9]/g, ""))
        .filter((w) => w.length > 4 && !stopWords.has(w))
    ),
  ];

  const scored = allPolicies.map((p) => {
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

  return {
    policies: selected,
    keywords,
    totalPoliciesScanned: allPolicies.length,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { questions } = await req.json();

    if (!questions?.length) {
      return NextResponse.json(
        { error: "Questions are required" },
        { status: 400 }
      );
    }

    const { policies: relevant, keywords, totalPoliciesScanned } =
      selectRelevantPolicies(questions);
    const results = await analyzeCompliance(questions, relevant);

    return NextResponse.json({
      results,
      meta: {
        keywords,
        policiesMatched: relevant.map((p) => p.name),
        totalPoliciesScanned,
        contextChars: relevant.reduce((sum, p) => sum + p.text.length, 0),
      },
    });
  } catch (e) {
    console.error("Error analyzing compliance:", e);
    return NextResponse.json(
      { error: "Compliance analysis failed" },
      { status: 500 }
    );
  }
}
