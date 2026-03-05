// Axios API client for CredIntel AI backend
import axios from "axios";
import { getIdToken } from "./firebase";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });

// Attach Firebase auth token to every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await getIdToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

// ── Document Upload ───────────────────────────────────────────────────────────

export interface UploadResponse {
  company_id:  string;
  company_name: string;
  documents: {
    filename: string;
    status:   string;
    num_chunks?: number;
    signals?:   Record<string, unknown>;
    error?:     string;
  }[];
}

export async function uploadDocuments(
  companyName: string,
  companyId: string,
  files: File[],
): Promise<UploadResponse> {
  const form = new FormData();
  form.append("company_name", companyName);
  form.append("company_id", companyId);
  files.forEach((f) => form.append("files", f));
  const { data } = await api.post<UploadResponse>("/upload-documents", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// ── Company Analysis ──────────────────────────────────────────────────────────

export interface AnalysisResponse {
  analysis_id:  string;
  company_id:   string;
  company_name: string;
  research:     Record<string, unknown>;
  rag_summary:  Record<string, string>;
  score: {
    character_score:    number;
    capacity_score:     number;
    capital_score:      number;
    collateral_score:   number;
    conditions_score:   number;
    overall_credit_score: number;
    risk_category:      string;
    score_breakdown:    Record<string, unknown>;
  };
}

export async function analyzeCompany(
  companyName: string,
  companyId:   string,
): Promise<AnalysisResponse> {
  const { data } = await api.post<AnalysisResponse>("/analyze-company", {
    company_name:      companyName,
    company_id:        companyId,
    include_research:  true,
    include_rag:       true,
  });
  return data;
}

// ── Generate Report ───────────────────────────────────────────────────────────

export interface ReportResponse {
  analysis_id: string;
  pdf_url:     string;
  docx_url:    string;
}

export async function generateReport(
  companyName:     string,
  companyId:       string,
  analysisId:      string,
  researchData:    Record<string, unknown>,
  scoreData:       Record<string, unknown>,
  financialSignals?: Record<string, unknown>,
): Promise<ReportResponse> {
  const { data } = await api.post<ReportResponse>("/generate-report", {
    company_name:     companyName,
    company_id:       companyId,
    analysis_id:      analysisId,
    research_data:    researchData,
    score_data:       scoreData,
    financial_signals: financialSignals,
  });
  return data;
}

// ── Risk Score ────────────────────────────────────────────────────────────────

export async function getRiskScore(companyId: string) {
  const { data } = await api.get(`/risk-score/${companyId}`);
  return data;
}

export default api;
