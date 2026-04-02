import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const EMBEDDING_MODEL = "text-embedding-3-small";

let _pc: Pinecone | null = null;
let _openai: OpenAI | null = null;

function getPinecone(): Pinecone {
  if (!_pc) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY environment variable is required");
    }
    _pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return _pc;
}

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }
  return _openai;
}

const indexName = process.env.PINECONE_INDEX_NAME ?? "readily-policies";

export interface RetrievedChunk {
  policyName: string;
  category: string;
  pageNum: number;
  text: string;
  score: number;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const res = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

export async function queryRelevantChunks(
  questionTexts: string[],
  topK: number = 10
): Promise<RetrievedChunk[]> {
  const index = getPinecone().index(indexName);

  const embeddings = await embedTexts(questionTexts);

  const allChunks = new Map<string, RetrievedChunk>();

  const queries = embeddings.map((vector) =>
    index.query({
      vector,
      topK,
      includeMetadata: true,
    })
  );

  const results = await Promise.all(queries);

  for (const result of results) {
    for (const match of result.matches) {
      if (!match.metadata) continue;
      const id = match.id;
      const existing = allChunks.get(id);
      const score = match.score ?? 0;
      if (!existing || existing.score < score) {
        allChunks.set(id, {
          policyName: match.metadata.policyName as string,
          category: match.metadata.category as string,
          pageNum: match.metadata.pageNum as number,
          text: match.metadata.text as string,
          score,
        });
      }
    }
  }

  return [...allChunks.values()].sort((a, b) => b.score - a.score);
}
