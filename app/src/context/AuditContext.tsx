"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type {
  PolicySummary,
  PolicyDocument,
  AuditQuestion,
  AnalysisResult,
} from "@/lib/types";

type AnalysisPhase =
  | "idle"
  | "uploading-questionnaire"
  | "analyzing"
  | "done"
  | "error";

interface AuditState {
  policyList: PolicySummary[];
  selectedPolicyNames: string[];
  questions: AuditQuestion[];
  results: AnalysisResult[];
  phase: AnalysisPhase;
  error: string | null;
}

interface AuditActions {
  fetchPolicies: (search?: string) => Promise<void>;
  togglePolicy: (name: string) => void;
  selectAllPolicies: () => void;
  clearPolicies: () => void;
  uploadQuestionnaire: (file: File) => Promise<void>;
  runAnalysis: () => Promise<void>;
  reset: () => void;
}

const STORAGE_KEY = "readily-audit-state";

interface PersistedState {
  selectedPolicyNames: string[];
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
  } catch {
    // storage full or unavailable
  }
}

const AuditContext = createContext<(AuditState & AuditActions) | null>(null);

export function AuditProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [policyList, setPolicyList] = useState<PolicySummary[]>([]);
  const [selectedPolicyNames, setSelectedPolicyNames] = useState<string[]>([]);
  const [questions, setQuestions] = useState<AuditQuestion[]>([]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadPersistedState();
    if (saved.selectedPolicyNames) setSelectedPolicyNames(saved.selectedPolicyNames);
    if (saved.questions) setQuestions(saved.questions);
    if (saved.results) setResults(saved.results);
    if (saved.phase === "done") setPhase("done");
    setHydrated(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!hydrated) return;
    persistState({
      selectedPolicyNames,
      questions,
      results,
      phase: phase === "done" ? "done" : "idle",
    });
  }, [hydrated, selectedPolicyNames, questions, results, phase]);

  const fetchPolicies = useCallback(async (search?: string) => {
    try {
      const url = search
        ? `/api/policies?search=${encodeURIComponent(search)}`
        : "/api/policies";
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPolicyList(data.policies);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch policies");
    }
  }, []);

  const togglePolicy = useCallback((name: string) => {
    setSelectedPolicyNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }, []);

  const selectAllPolicies = useCallback(() => {
    setSelectedPolicyNames(policyList.map((p) => p.name));
  }, [policyList]);

  const clearPolicies = useCallback(() => {
    setSelectedPolicyNames([]);
  }, []);

  const uploadQuestionnaire = useCallback(async (file: File) => {
    setPhase("uploading-questionnaire");
    setError(null);
    try {
      const { extractTextFromPDFClient } = await import("@/lib/pdf-client");
      const text = await extractTextFromPDFClient(file);

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
    setPhase("analyzing");
    setError(null);
    try {
      const policyRes = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: selectedPolicyNames }),
      });
      if (!policyRes.ok) throw new Error("Failed to load policy texts");
      const { policies } = (await policyRes.json()) as {
        policies: PolicyDocument[];
      };

      const policyTexts = policies.map((p) => ({
        name: p.name,
        text: p.pages.map((pg) => `[Page ${pg.page}] ${pg.text}`).join("\n"),
      }));

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, policyTexts }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setResults(data.results);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      setPhase("error");
    }
  }, [questions, selectedPolicyNames]);

  const reset = useCallback(() => {
    setSelectedPolicyNames([]);
    setQuestions([]);
    setResults([]);
    setPhase("idle");
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuditContext.Provider
      value={{
        policyList,
        selectedPolicyNames,
        questions,
        results,
        phase,
        error,
        fetchPolicies,
        togglePolicy,
        selectAllPolicies,
        clearPolicies,
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
