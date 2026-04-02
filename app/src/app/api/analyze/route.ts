import { NextRequest, NextResponse } from "next/server";
import { analyzeCompliance } from "@/lib/gemini";
import { queryRelevantChunks, type RetrievedChunk } from "@/lib/pinecone";

const TOP_K_PER_QUESTION = 10;

function buildContext(chunks: RetrievedChunk[]): {
  policyTexts: { name: string; text: string }[];
  policiesFound: string[];
} {
  const byPolicy = new Map<string, Map<number, string>>();

  for (const chunk of chunks) {
    let pages = byPolicy.get(chunk.policyName);
    if (!pages) {
      pages = new Map();
      byPolicy.set(chunk.policyName, pages);
    }
    if (!pages.has(chunk.pageNum)) {
      pages.set(chunk.pageNum, chunk.text);
    }
  }

  const policyTexts = [...byPolicy.entries()].map(([name, pages]) => {
    const sorted = [...pages.entries()].sort((a, b) => a[0] - b[0]);
    const text = sorted
      .map(([pageNum, pageText]) => `[Page ${pageNum}] ${pageText}`)
      .join("\n");
    return { name, text };
  });

  return {
    policyTexts,
    policiesFound: [...byPolicy.keys()],
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

    const questionTexts = questions.map(
      (q: { text: string; reference: string }) =>
        `${q.text} ${q.reference}`
    );

    const chunks = await queryRelevantChunks(questionTexts, TOP_K_PER_QUESTION);
    const { policyTexts, policiesFound } = buildContext(chunks);

    const results = await analyzeCompliance(questions, policyTexts);

    return NextResponse.json({
      results,
      meta: {
        policiesMatched: policiesFound,
        chunksRetrieved: chunks.length,
        totalCharsContext: policyTexts.reduce(
          (sum, p) => sum + p.text.length,
          0
        ),
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
