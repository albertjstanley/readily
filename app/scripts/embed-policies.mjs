import fs from "fs";
import path from "path";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const POLICY_INDEX_PATH = path.resolve("src/lib/policy-index.json");
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
const UPSERT_BATCH = 100;
const EMBED_BATCH = 50;

const apiKey = process.env.PINECONE_API_KEY;
const indexName = process.env.PINECONE_INDEX_NAME ?? "readily-policies";
const openaiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("PINECONE_API_KEY is required. Set it in .env.local or export it.");
  process.exit(1);
}
if (!openaiKey) {
  console.error("OPENAI_API_KEY is required.");
  process.exit(1);
}

const pc = new Pinecone({ apiKey });
const openai = new OpenAI({ apiKey: openaiKey });

async function ensureIndex() {
  const existing = await pc.listIndexes();
  const names = existing.indexes?.map((i) => i.name) ?? [];

  if (!names.includes(indexName)) {
    console.log(`Creating index "${indexName}"...`);
    await pc.createIndex({
      name: indexName,
      dimension: EMBEDDING_DIMENSIONS,
      metric: "cosine",
      spec: { serverless: { cloud: "aws", region: "us-east-1" } },
    });
    console.log("Waiting for index to be ready...");
    await new Promise((r) => setTimeout(r, 30000));
  } else {
    console.log(`Index "${indexName}" already exists.`);
  }
}

async function embedBatch(texts) {
  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

async function main() {
  console.log("Loading policy index...");
  const policies = JSON.parse(fs.readFileSync(POLICY_INDEX_PATH, "utf-8"));

  const chunks = [];
  for (const policy of policies) {
    for (const page of policy.pages) {
      if (!page.text || page.text.trim().length < 20) continue;
      chunks.push({
        id: `${policy.name}::page-${page.page}`,
        text: page.text.slice(0, 8000),
        metadata: {
          policyName: policy.name,
          category: policy.category,
          pageNum: page.page,
          text: page.text.slice(0, 3600),
        },
      });
    }
  }

  console.log(`Total chunks to embed: ${chunks.length}`);

  await ensureIndex();
  const index = pc.index(indexName);

  let embedded = 0;
  let upserted = 0;
  const pendingVectors = [];

  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const batch = chunks.slice(i, i + EMBED_BATCH);
    const texts = batch.map((c) => c.text);

    try {
      const embeddings = await embedBatch(texts);

      for (let j = 0; j < batch.length; j++) {
        pendingVectors.push({
          id: batch[j].id,
          values: embeddings[j],
          metadata: batch[j].metadata,
        });
      }

      embedded += batch.length;
    } catch (e) {
      console.error(`  Embedding error at batch ${i}: ${e.message}`);
      continue;
    }

    while (pendingVectors.length >= UPSERT_BATCH) {
      const upsertBatch = pendingVectors.splice(0, UPSERT_BATCH);
      await index.upsert({ records: upsertBatch });
      upserted += upsertBatch.length;
    }

    if (embedded % 200 === 0 || i + EMBED_BATCH >= chunks.length) {
      console.log(
        `  Embedded: ${embedded}/${chunks.length} | Upserted: ${upserted}`
      );
    }
  }

  if (pendingVectors.length > 0) {
    await index.upsert({ records: pendingVectors });
    upserted += pendingVectors.length;
  }

  console.log(`\nDone! ${embedded} chunks embedded, ${upserted} vectors upserted to "${indexName}".`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
