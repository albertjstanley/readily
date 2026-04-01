"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAudit } from "@/context/AuditContext";
import { PolicyBrowser } from "@/components/PolicyBrowser";
import { FileUploader } from "@/components/FileUploader";
import { ProgressBar } from "@/components/ProgressBar";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const {
    selectedPolicyNames,
    questions,
    phase,
    error,
    uploadQuestionnaire,
    runAnalysis,
  } = useAudit();

  const [questionnaireFile, setQuestionnaireFile] = useState<File[]>([]);

  const policiesReady = selectedPolicyNames.length > 0;
  const questionsReady = questions.length > 0;
  const canAnalyze = policiesReady && questionsReady && phase === "idle";

  const handleUploadQuestionnaire = async () => {
    if (questionnaireFile.length === 0) return;
    await uploadQuestionnaire(questionnaireFile[0]);
  };

  const handleAnalyze = async () => {
    await runAnalysis();
    router.push("/results");
  };

  const isProcessing = phase === "uploading-questionnaire" || phase === "analyzing";

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="mb-10 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-10 w-10 text-blue-600" />
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Compliance Audit Tool
          </h1>
        </div>
        <p className="max-w-lg text-zinc-500">
          Select policy documents and upload an audit questionnaire to
          automatically check compliance and find supporting evidence.
        </p>
      </div>

      {isProcessing ? (
        <ProgressBar
          message={
            phase === "uploading-questionnaire"
              ? "Extracting audit questions..."
              : "Analyzing compliance — this may take a minute..."
          }
        />
      ) : (
        <div className="w-full max-w-5xl">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Policy Selection Panel */}
            <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-800">
                1. Select Policies
              </h2>
              <PolicyBrowser />
              {policiesReady && (
                <p className="text-xs text-emerald-600">
                  {selectedPolicyNames.length} policies selected
                </p>
              )}
            </div>

            {/* Audit Questionnaire Panel */}
            <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-800">
                  2. Upload Audit Questions
                </h2>
                {questionsReady && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                    {questions.length} questions
                  </span>
                )}
              </div>

              <FileUploader
                label="Audit Questionnaire"
                description="Drag & drop the audit questions PDF"
                files={questionnaireFile}
                onFilesChange={setQuestionnaireFile}
                disabled={isProcessing}
              />

              <button
                type="button"
                onClick={handleUploadQuestionnaire}
                disabled={questionnaireFile.length === 0 || isProcessing}
                className="mt-auto rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
              >
                Extract Questions
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-xl bg-red-50 px-5 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none"
            >
              Run Compliance Analysis
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          {(!policiesReady || !questionsReady) && (
            <p className="mt-3 text-center text-xs text-zinc-400">
              {!policiesReady && !questionsReady
                ? "Select policies and upload the audit questionnaire to begin."
                : !policiesReady
                  ? "Select at least one policy document to continue."
                  : "Upload and extract the audit questionnaire to continue."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
