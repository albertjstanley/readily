"use client";

import {
  Loader2,
  FileText,
  Search,
  Brain,
  CheckCircle2,
  Clock,
  Database,
  Tag,
} from "lucide-react";
import type { AnalysisProgress as ProgressData } from "@/context/AuditContext";

interface Props {
  phase: string;
  progress: ProgressData | null;
  questionsTotal: number;
}

function formatTime(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

function EstimatedTime({ progress }: { progress: ProgressData }) {
  const { batchCompleted, batchTotal, batchTimesMs } = progress;
  if (batchTimesMs.length === 0 || batchCompleted >= batchTotal) return null;

  const avgMs =
    batchTimesMs.reduce((a, b) => a + b, 0) / batchTimesMs.length;
  const remaining = (batchTotal - batchCompleted) * avgMs;
  const elapsed = batchTimesMs.reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-center gap-4 text-xs text-zinc-500">
      <span className="flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" />
        Elapsed: {formatTime(elapsed)}
      </span>
      <span>~{formatTime(remaining)} remaining</span>
    </div>
  );
}

const UPLOAD_STEPS = [
  { key: "parsing-pdf", label: "Parsing PDF in browser", icon: FileText },
  {
    key: "extracting-questions",
    label: "AI is extracting structured questions",
    icon: Brain,
  },
];

export function AnalysisProgressView({ phase, progress, questionsTotal }: Props) {
  if (phase === "parsing-pdf" || phase === "extracting-questions") {
    return (
      <div className="w-full max-w-xl">
        <div className="rounded-2xl border border-zinc-100 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-zinc-800">
            Processing Questionnaire
          </h2>
          <div className="flex flex-col gap-4">
            {UPLOAD_STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = phase === step.key;
              const isDone =
                UPLOAD_STEPS.findIndex((s) => s.key === phase) >
                UPLOAD_STEPS.findIndex((s) => s.key === step.key);

              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : isDone
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-zinc-400"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                  ) : isActive ? (
                    <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5 flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "analyzing" && progress) {
    const pct = Math.round(
      (progress.batchCompleted / progress.batchTotal) * 100
    );
    const questionsCompleted = Math.min(
      progress.batchCompleted * 5,
      questionsTotal
    );

    return (
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl border border-zinc-100 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-800">
              Analyzing Compliance
            </h2>
            <span className="text-sm font-medium text-blue-600">
              {pct}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Stats row */}
          <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500">
            <span>
              Batch {progress.batchCompleted}/{progress.batchTotal}
            </span>
            <span>
              {questionsCompleted}/{questionsTotal} questions
            </span>
            <EstimatedTime progress={progress} />
          </div>

          {/* Details panels */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Policies matched */}
            <div className="rounded-xl bg-zinc-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <Database className="h-3.5 w-3.5" />
                Policies matched
                {progress.totalPoliciesScanned > 0 && (
                  <span className="font-normal">
                    ({progress.policiesMatched.length} of{" "}
                    {progress.totalPoliciesScanned} scanned)
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                {progress.policiesMatched.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">
                    Searching...
                  </p>
                ) : (
                  progress.policiesMatched.map((name) => (
                    <div
                      key={name}
                      className="flex items-center gap-1.5 text-xs text-zinc-600"
                    >
                      <FileText className="h-3 w-3 flex-shrink-0 text-blue-400" />
                      <span className="truncate">
                        {name.replace(".pdf", "")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Keywords used */}
            <div className="rounded-xl bg-zinc-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <Tag className="h-3.5 w-3.5" />
                Search keywords
                {progress.keywords.length > 0 && (
                  <span className="font-normal">
                    ({progress.keywords.length})
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {progress.keywords.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">
                    Extracting...
                  </p>
                ) : (
                  progress.keywords.slice(0, 40).map((kw) => (
                    <span
                      key={kw}
                      className="inline-block rounded-md bg-white px-2 py-0.5 text-xs text-zinc-600 shadow-sm border border-zinc-200"
                    >
                      {kw}
                    </span>
                  ))
                )}
                {progress.keywords.length > 40 && (
                  <span className="text-xs text-zinc-400">
                    +{progress.keywords.length - 40} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-6 rounded-xl bg-blue-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-blue-700">
              <Search className="h-3.5 w-3.5" />
              How this works
            </div>
            <ol className="list-decimal list-inside space-y-1 text-xs text-blue-600">
              <li>
                Keywords are extracted from each batch of audit questions
              </li>
              <li>
                All {progress.totalPoliciesScanned || 373} policy documents are
                scanned for keyword matches
              </li>
              <li>
                The most relevant policies (up to 80k chars) are sent to
                GPT-4o-mini
              </li>
              <li>
                AI determines compliance status and locates evidence with page
                numbers
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-sm text-zinc-500">Starting analysis...</p>
    </div>
  );
}
