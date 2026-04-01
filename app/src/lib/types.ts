export interface PolicySummary {
  name: string;
  category: string;
  totalPages: number;
  matchingPages?: number[];
}

export interface PolicyDocument {
  name: string;
  category: string;
  pages: { page: number; text: string }[];
}

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
