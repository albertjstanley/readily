"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAudit } from "@/context/AuditContext";
import { SummaryCards } from "@/components/SummaryCards";
import { QuestionCard } from "@/components/QuestionCard";
import { ArrowLeft, Download, Search } from "lucide-react";
import type { ComplianceStatus } from "@/lib/types";

type FilterStatus = "all" | ComplianceStatus;

export default function ResultsPage() {
  const router = useRouter();
  const { questions, results, reset } = useAudit();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (search) {
        const q = questions.find((q) => q.number === r.questionNumber);
        const haystack =
          `${q?.text ?? ""} ${r.evidence} ${r.explanation}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [results, filter, search, questions]);

  const handleExport = () => {
    const rows = results.map((r) => {
      const q = questions.find((q) => q.number === r.questionNumber);
      return [
        r.questionNumber,
        `"${q?.text?.replace(/"/g, '""') ?? ""}"`,
        r.status,
        `"${r.evidence?.replace(/"/g, '""') ?? ""}"`,
        `"${r.sourceDocument?.replace(/"/g, '""') ?? ""}"`,
        `"${r.explanation?.replace(/"/g, '""') ?? ""}"`,
      ].join(",");
    });
    const csv =
      "Question #,Question,Status,Evidence,Source Document,Explanation\n" +
      rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compliance-audit-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (results.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <p className="text-zinc-500">
          No results yet. Run an analysis first.
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            reset();
            router.push("/");
          }}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
          New Audit
        </button>

        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <SummaryCards results={results} />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(
            [
              ["all", "All"],
              ["met", "Met"],
              ["partial", "Partial"],
              ["not_met", "Not Met"],
            ] as [FilterStatus, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === value
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-zinc-100 py-2 pl-9 pr-4 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-64"
          />
        </div>
      </div>

      {/* Question List */}
      <div className="flex flex-col gap-3">
        {filteredResults.map((result) => {
          const question = questions.find(
            (q) => q.number === result.questionNumber
          );
          if (!question) return null;
          return (
            <QuestionCard
              key={result.questionNumber}
              question={question}
              result={result}
            />
          );
        })}

        {filteredResults.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-400">
            No questions match the current filter.
          </p>
        )}
      </div>
    </div>
  );
}
