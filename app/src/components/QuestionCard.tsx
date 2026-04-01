"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { AuditQuestion, AnalysisResult } from "@/lib/types";

interface QuestionCardProps {
  question: AuditQuestion;
  result: AnalysisResult;
}

export function QuestionCard({ question, result }: QuestionCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-zinc-100 transition-shadow hover:shadow-md">
      <button
        type="button"
        className="flex w-full items-start gap-4 px-5 py-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="mt-0.5 shrink-0 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-mono font-semibold text-zinc-500">
          Q{question.number}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed text-zinc-800">
            {question.text}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {question.reference}
          </p>
        </div>
        <StatusBadge status={result.status} />
        {open ? (
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-zinc-400" />
        ) : (
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-zinc-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-5 py-4">
          <div className="mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Explanation
            </h4>
            <p className="text-sm text-zinc-700 leading-relaxed">
              {result.explanation}
            </p>
          </div>

          {result.evidence && (
            <div className="mt-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Evidence
              </h4>
              <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                <div>
                  {result.sourceDocument && (
                    <p className="text-xs font-medium text-blue-600 mb-1">
                      {result.sourceDocument.replace(".pdf", "")}
                      {result.sourcePage ? ` — Page ${result.sourcePage}` : ""}
                    </p>
                  )}
                  <p className="text-sm text-blue-900 leading-relaxed italic">
                    &ldquo;{result.evidence}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
