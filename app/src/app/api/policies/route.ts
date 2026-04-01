import { NextRequest, NextResponse } from "next/server";
import policyIndex from "@/lib/policy-index.json";

interface PolicyEntry {
  name: string;
  category: string;
  pages: { page: number; text: string }[];
}

const policies = policyIndex as PolicyEntry[];

// GET /api/policies — list all policies (name + category only, no text)
// GET /api/policies?search=hospice — search policy text
export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search")?.toLowerCase();

  if (search) {
    const matches = policies
      .filter((p) =>
        p.pages.some((pg) => pg.text.toLowerCase().includes(search))
      )
      .map((p) => ({
        name: p.name,
        category: p.category,
        totalPages: p.pages.length,
        matchingPages: p.pages
          .filter((pg) => pg.text.toLowerCase().includes(search))
          .map((pg) => pg.page),
      }));
    return NextResponse.json({ policies: matches, total: matches.length });
  }

  const list = policies.map((p) => ({
    name: p.name,
    category: p.category,
    totalPages: p.pages.length,
  }));

  return NextResponse.json({ policies: list, total: list.length });
}

// POST /api/policies — get full text for selected policies
export async function POST(req: NextRequest) {
  const { names } = (await req.json()) as { names: string[] };

  const selected = policies
    .filter((p) => names.includes(p.name))
    .map((p) => ({
      name: p.name,
      category: p.category,
      pages: p.pages,
    }));

  return NextResponse.json({ policies: selected });
}
