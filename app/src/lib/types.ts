export interface AuditQuestion {
  number: number;
  text: string;
  reference: string;
}

export type ComplianceStatus = "met" | "not_met" | "partial";

export interface AnalysisResult {
  questionNumber: number;
  status: ComplianceStatus;
  evidence: string;
  sourceDocument: string;
  sourcePage?: number;
  explanation: string;
}
