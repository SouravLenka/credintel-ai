"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { generateReport } from "@/lib/api";
import { FileText, Download, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

export default function ReportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [report,     setReport]     = useState<{ pdf_url: string; docx_url: string } | null>(null);
  const [companyName, setCompanyName] = useState("Company");
  const [hasData,     setHasData]     = useState(false);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    if (!loading && !user) { router.push("/"); return; }
    setCompanyName(localStorage.getItem("credintel_company_name") || "Company");
    const hasScore = !!localStorage.getItem("credintel_score_data");
    setHasData(hasScore);
  }, [user, loading, router]);

  const handleGenerate = async () => {
    const analysisId   = localStorage.getItem("credintel_analysis_id") || "no-id";
    const companyId    = localStorage.getItem("credintel_company_id")   || "no-id";
    const researchRaw  = localStorage.getItem("credintel_research_data");
    const scoreRaw     = localStorage.getItem("credintel_score_data");

    if (!researchRaw || !scoreRaw) { toast.error("Run analysis first."); return; }

    setGenerating(true);
    try {
      const result = await generateReport(
        companyName, companyId, analysisId,
        JSON.parse(researchRaw), JSON.parse(scoreRaw),
      );
      setReport(result);
      toast.success("CAM report generated!");
    } catch (e) {
      toast.error("Report generation failed. Check backend connection.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <Sidebar />
      <main className="ml-60 pt-16 p-8">
        <div className="max-w-3xl">
          <div className="mb-8">
            <h1 className="section-title text-3xl">📋 CAM Report</h1>
            <p className="section-subtitle">Generate a professional Credit Appraisal Memo for {companyName}</p>
          </div>

          {!hasData ? (
            <div className="glass-card p-12 text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No analysis data found</p>
              <p className="text-slate-500 text-sm mb-4">Run your analysis first.</p>
              <a href="/research" className="btn-primary">Go to Research →</a>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Report preview card */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-200">Credit Appraisal Memo</h2>
                    <p className="text-sm text-slate-400">Borrower: {companyName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    "Borrower Overview",
                    "Industry Analysis",
                    "Financial Analysis",
                    "Promoter Background",
                    "Risk Analysis",
                    "Credit Recommendation",
                  ].map((section) => (
                    <div key={section} className="flex items-center gap-2 text-sm text-slate-400">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {section}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 w-full justify-center"
                >
                  {generating
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</>
                    : <><FileText className="w-4 h-4" />Generate CAM Report</>}
                </button>
              </div>

              {/* Downloads */}
              {report && (
                <div className="glass-card p-6 animate-fade-in">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <h3 className="font-semibold text-green-400">Report Ready!</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={`${BACKEND}${report.pdf_url}`}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <Download className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-200 text-sm">Download PDF</p>
                        <p className="text-xs text-slate-500">Credit Appraisal Memo</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 ml-auto group-hover:text-red-400" />
                    </a>

                    <a
                      href={`${BACKEND}${report.docx_url}`}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Download className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-200 text-sm">Download DOCX</p>
                        <p className="text-xs text-slate-500">Editable Word Document</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 ml-auto group-hover:text-blue-400" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
