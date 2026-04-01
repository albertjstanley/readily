"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { AuditQuestion, AnalysisResult } from "@/lib/types";

export type AnalysisPhase =
  | "idle"
  | "uploading-questionnaire"
  | "parsing-pdf"
  | "extracting-questions"
  | "analyzing"
  | "done"
  | "error";

export interface AnalysisProgress {
  batchCompleted: number;
  batchTotal: number;
  keywords: string[];
  policiesMatched: string[];
  totalPoliciesScanned: number;
  batchTimesMs: number[];
}

interface AuditState {
  questions: AuditQuestion[];
  results: AnalysisResult[];
  phase: AnalysisPhase;
  error: string | null;
  analysisProgress: AnalysisProgress | null;
}

interface AuditActions {
  uploadQuestionnaire: (file: File) => Promise<void>;
  runAnalysis: () => Promise<void>;
  reset: () => void;
}

const STORAGE_KEY = "readily-audit-state";

interface PersistedState {
  questions: AuditQuestion[];
  results: AnalysisResult[];
  phase: AnalysisPhase;
}

function loadPersistedState(): Partial<PersistedState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function persistState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const AuditContext = createContext<(AuditState & AuditActions) | null>(null);

export function AuditProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [questions, setQuestions] = useState<AuditQuestion[]>([]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] =
    useState<AnalysisProgress | null>(null);

  useEffect(() => {
    const saved = loadPersistedState();
    if (saved.questions) setQuestions(saved.questions);
    if (saved.results) setResults(saved.results);
    if (saved.phase === "done") setPhase("done");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistState({
      questions,
      results,
      phase: phase === "done" ? "done" : "idle",
    });
  }, [hydrated, questions, results, phase]);

  const uploadQuestionnaire = useCallback(async (file: File) => {
    setError(null);
    try {
      setPhase("parsing-pdf");
      const { extractTextFromPDFClient } = await import("@/lib/pdf-client");
      const text = await extractTextFromPDFClient(file);

      setPhase("extracting-questions");
      const res = await fetch("/api/parse-questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setQuestions(data.questions);
      setPhase("idle");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to parse questionnaire"
      );
      setPhase("error");
    }
  }, []);

  const runAnalysis = useCallback(async () => {
    const BATCH_SIZE = 5;
    setPhase("analyzing");
    setError(null);
    setResults([]);
    try {
      const totalBatches = Math.ceil(questions.length / BATCH_SIZE);
      const allResults: AnalysisResult[] = [];
      const allKeywords = new Set<string>();
      const allPolicies = new Set<string>();
      const batchTimesMs: number[] = [];
      let totalScanned = 0;

      setAnalysisProgress({
        batchCompleted: 0,
        batchTotal: totalBatches,
        keywords: [],
        policiesMatched: [],
        totalPoliciesScanned: 0,
        batchTimesMs: [],
      });

      for (let i = 0; i < questions.length; i += BATCH_SIZE) {
        const batch = questions.slice(i, i + BATCH_SIZE);
        const batchStart = Date.now();

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: batch }),
        });

        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        const elapsed = Date.now() - batchStart;
        batchTimesMs.push(elapsed);

        allResults.push(...data.results);
        setResults([...allResults]);

        if (data.meta) {
          data.meta.keywords?.forEach((k: string) => allKeywords.add(k));
          data.meta.policiesMatched?.forEach((p: string) =>
            allPolicies.add(p)
          );
          totalScanned = data.meta.totalPoliciesScanned ?? totalScanned;
        }

        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        setAnalysisProgress({
          batchCompleted: batchNum,
          batchTotal: totalBatches,
          keywords: [...allKeywords],
          policiesMatched: [...allPolicies],
          totalPoliciesScanned: totalScanned,
          batchTimesMs: [...batchTimesMs],
        });
      }

      setPhase("done");
      setAnalysisProgress(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      setPhase("error");
      setAnalysisProgress(null);
    }
  }, [questions]);

  const reset = useCallback(() => {
    setQuestions([]);
    setResults([]);
    setPhase("idle");
    setError(null);
    setAnalysisProgress(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuditContext.Provider
      value={{
        questions,
        results,
        phase,
        error,
        analysisProgress,
        uploadQuestionnaire,
        runAnalysis,
        reset,
      }}
    >
      {children}
    </AuditContext.Provider>
  );
}

export function useAudit() {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useAudit must be used within AuditProvider");
  return ctx;
}
