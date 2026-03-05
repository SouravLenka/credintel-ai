"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { analyzeCompany } from "@/lib/api";
import { Search, Loader2, AlertTriangle, Globe, User, Scale, Newspaper, Building2 } from "lucide-react";
import toast from "react-hot-toast";

interface Analysis { 
  research: Record<string, any>; 
  score: {
    overall_credit_score: number;
    risk_category: string;
    risk_alerts: { type: string; message: string; severity: string }[];
    explanation: string[];
    indian_intel: Record<string, string>;
  }; 
  analysis_id: string; 
  company_id: string;
}

export default function ResearchPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [companyId,   setCompanyId]   = useState("");
  const [searching,   setSearching]   = useState(false);
  const [analysis,    setAnalysis]    = useState<Analysis | null>(null);
  const [loadStep,    setLoadStep]    = useState(0);

  useEffect(() => {
    if (!loading && !user) router.push("/");
    setCompanyName(localStorage.getItem("credintel_company_name") || "");
    setCompanyId(localStorage.getItem("credintel_company_id") || Math.random().toString(36).slice(2, 12));
  }, [user, loading, router]);

  const loadingSteps = [
    "Initializing research agent...",
    "Scanning financial documents...",
    "Searching web for company news...",
    "Fetching promoter litigation records...",
    "Analysing Indian market outlook (MCA/GST)...",
    "Calculating Five-Cs risk score...",
    "Finalizing AI insights..."
  ];

  useEffect(() => {
    let interval: any;
    if (searching) {
      setLoadStep(0);
      interval = setInterval(() => {
        setLoadStep((s) => (s < loadingSteps.length - 1 ? s + 1 : s));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [searching]);

  const handleSearch = async () => {
    if (!companyName.trim()) { toast.error("Enter company name"); return; }
    setSearching(true);
    setAnalysis(null);
    try {
      const result = await analyzeCompany(companyName, companyId);
      setAnalysis(result as unknown as Analysis);
      // Persist for next steps
      localStorage.setItem("credintel_analysis_id",   result.analysis_id);
      localStorage.setItem("credintel_company_id",    result.company_id);
      localStorage.setItem("credintel_research_data", JSON.stringify(result.research));
      localStorage.setItem("credintel_score_data",    JSON.stringify(result.score));
      toast.success("Research & scoring complete!");
    } catch (e) {
      toast.error("Analysis failed. Make sure the backend is running.");
    } finally {
      setSearching(false);
    }
  };

  if (loading || !user) return null;

  const research = analysis?.research;
  const score    = analysis?.score;

  return (
    <div className="min-h-screen">
      <Navbar />
      <Sidebar />
      <main className="ml-60 pt-16 p-8">
        <div className="max-w-4xl">
          <div className="mb-8">
            <h1 className="section-title text-3xl">🔍 Research Insights</h1>
            <p className="section-subtitle">Automated web research via AI-powered search agent</p>
          </div>

          {/* Search bar */}
          <div className="glass-card p-6 mb-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  className="input-field pl-10"
                  placeholder="Company name (e.g. ABC Steel Pvt Ltd)"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <button onClick={handleSearch} disabled={searching} className="btn-primary flex items-center gap-2 disabled:opacity-50 min-w-[140px] justify-center">
                {searching ? <><Loader2 className="w-4 h-4 animate-spin" />Researching…</> : <><Search className="w-4 h-4" />Run Research</>}
              </button>
            </div>
            
            {searching && (
              <div className="mt-6 p-4 bg-navy-900/50 rounded-xl border border-primary-500/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-primary-400 uppercase tracking-wider">AI Analysis in Progress</span>
                  <span className="text-xs text-slate-500">{Math.round(((loadStep + 1) / loadingSteps.length) * 100)}%</span>
                </div>
                <div className="w-full bg-navy-800 rounded-full h-1.5 mb-4">
                  <div 
                    className="bg-primary-500 h-1.5 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${((loadStep + 1) / loadingSteps.length) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                  <p className="text-sm text-slate-200 animate-pulse">{loadingSteps[loadStep]}</p>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {analysis && research && (
            <div className="space-y-6 animate-fade-in">
              {/* WOW Feature: Risk Alerts Panel */}
              {score?.risk_alerts && score.risk_alerts.length > 0 && (
                <div className="glass-card p-6 border-l-4 border-red-500 bg-red-500/5">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    <h2 className="text-lg font-bold text-red-500">Critical Risk Alerts</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {score.risk_alerts.map((alert, idx) => (
                      <div key={idx} className="flex gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-red-200 uppercase text-[10px] tracking-tight">{alert.type.replace("_", " ")}</p>
                          <p className="text-sm text-slate-300">{alert.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Research sections */}
              <div className="grid grid-cols-1 gap-4">
                {[
                  { key: "news_summary",       label: "Recent News & Media",   icon: Newspaper },
                  { key: "promoter_summary",   label: "Promoter Background",   icon: User      },
                  { key: "sector_summary",     label: "Sector & Market Trends",icon: Globe     },
                  { key: "litigation_summary", label: "Litigation History",    icon: Scale     },
                  { key: "regulatory_summary", label: "Regulatory & Compliance",icon: Building2 },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="glass-card p-6 group hover:border-primary-500/40 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-primary-600/10 flex items-center justify-center group-hover:bg-primary-600/20 transition-all">
                          <Icon className="w-5 h-5 text-primary-400" />
                        </div>
                        <h3 className="font-bold text-slate-100">{label}</h3>
                      </div>
                      <span className="text-[10px] font-bold text-primary-500/50 uppercase tracking-widest">AI SUMMARY</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-chill">{research[key] || "No data available."}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-center pt-4">
                <a href="/risk" className="btn-primary flex items-center gap-2 px-8 py-4 text-lg">
                  Next: Visualize Risk Analysis →
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
