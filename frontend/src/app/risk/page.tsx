"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from "recharts";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface ScoreData {
  character_score:    number;
  capacity_score:     number;
  capital_score:      number;
  collateral_score:   number;
  conditions_score:   number;
  overall_credit_score: number;
  risk_category:      string;
  explanation:        string[];
  risk_alerts:        { type: string; message: string; severity: string }[];
  indian_intel:       Record<string, string>;
  score_breakdown: {
    ratios: {
      debt_to_revenue: number;
      current_ratio: number;
      dscr: number;
    }
  };
}

const FIVE_C_LABELS: Record<string, string> = {
  character_score:  "Character",
  capacity_score:   "Capacity",
  capital_score:    "Capital",
  collateral_score: "Collateral",
  conditions_score: "Conditions",
};

const FIVE_C_DESCRIPTIONS: Record<string, string> = {
  Character:  "Reputation, management track record, and litigation history.",
  Capacity:   "Cash flow generation and debt servicing ability.",
  Capital:    "Net worth, equity ratio, and financial buffer.",
  Collateral: "Assets available as security against the credit.",
  Conditions: "Industry outlook and macro-economic environment.",
};

export default function RiskPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [companyName, setCompanyName] = useState("Company");

  useEffect(() => {
    if (!loading && !user) { router.push("/"); return; }
    const stored = localStorage.getItem("credintel_score_data");
    if (stored) {
      try {
        setScoreData(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse score data", e);
      }
    }
    setCompanyName(localStorage.getItem("credintel_company_name") || "Company");
  }, [user, loading, router]);

  if (loading || !user) return null;

  const radarData = scoreData
    ? Object.entries(FIVE_C_LABELS).map(([key, label]) => ({
        label,
        score: (scoreData[key as keyof ScoreData] as number) ?? 0,
      }))
    : [];

  const ratioData = scoreData?.score_breakdown?.ratios ? [
    { name: "Debt/Rev", value: scoreData.score_breakdown.ratios.debt_to_revenue * 100, full: 100, label: `${(scoreData.score_breakdown.ratios.debt_to_revenue * 100).toFixed(0)}%` },
    { name: "Current",  value: (scoreData.score_breakdown.ratios.current_ratio / 2) * 100, full: 100, label: scoreData.score_breakdown.ratios.current_ratio.toString() },
    { name: "DSCR",     value: (scoreData.score_breakdown.ratios.dscr / 2) * 100, full: 100, label: scoreData.score_breakdown.ratios.dscr.toString() },
  ] : [];

  const riskColor = {
    Low:    "#22c55e",
    Medium: "#f59e0b",
    High:   "#ef4444",
  }[scoreData?.risk_category ?? "High"] ?? "#ef4444";

  const BadgeClass = {
    Low:    "badge-low",
    Medium: "badge-medium",
    High:   "badge-high",
  }[scoreData?.risk_category ?? "High"] ?? "badge-high";

  return (
    <div className="min-h-screen">
      <Navbar />
      <Sidebar />
      <main className="ml-60 pt-16 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="section-title text-3xl">📊 Risk Analytics</h1>
            <p className="section-subtitle">Comprehensive Five-Cs credit assessment for {companyName}</p>
          </div>

          {!scoreData ? (
            <div className="glass-card p-12 text-center">
              <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No score data yet</p>
              <p className="text-slate-500 text-sm mb-4">Run research &amp; analysis first.</p>
              <a href="/research" className="btn-primary">Go to Research →</a>
            </div>
          ) : (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Overall & Radar */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Overall score */}
                  <div className="glass-card p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2">
                       <div className="w-20 h-20 bg-primary-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    </div>
                    
                    <div className="relative w-32 h-32 mb-4">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(37,99,235,0.1)" strokeWidth="10" />
                        <circle
                          cx="50" cy="50" r="44" fill="none"
                          stroke={riskColor}
                          strokeWidth="10"
                          strokeDasharray={`${2 * Math.PI * 44}`}
                          strokeDashoffset={`${2 * Math.PI * 44 * (1 - scoreData.overall_credit_score / 100)}`}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-3xl font-black text-white">{scoreData.overall_credit_score.toFixed(0)}</span>
                        <span className="text-xs text-slate-500 font-bold">/100</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-tighter">Credit Reliability Score</p>
                    <span className={`${BadgeClass} px-4 py-1.5 text-xs font-bold`}>{scoreData.risk_category} RISK</span>
                  </div>

                  {/* Radar */}
                  <div className="glass-card p-6 h-[340px]">
                    <h3 className="font-bold text-slate-200 mb-4 text-xs uppercase tracking-widest text-primary-500">Multidimensional Risk</h3>
                    <ResponsiveContainer width="100%" height="85%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(37,99,235,0.15)" />
                        <PolarAngleAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} />
                        <Radar name="Score" dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Right Column: Explainable AI & Ratios */}
                <div className="lg:col-span-2 space-y-6">
                  {/* WOW Feature: Explainable AI Panel */}
                  <div className="glass-card p-6 border-l-4 border-primary-500">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-primary-500/10">
                        <Info className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100">Why This Decision?</h3>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Explainable AI Insights</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-sm text-slate-300 font-medium">
                        The AI engine assigned a <span className="text-primary-400 font-black">{scoreData.risk_category} Risk</span> rating based on the following key drivers:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {scoreData.explanation?.map((reason, i) => (
                          <div key={i} className="flex gap-2 items-start p-3 rounded-xl bg-navy-900/40 border border-slate-800">
                            {reason.includes("Strong") || reason.includes("Positive") || reason.includes("Clean") || reason.includes("Steady") ? (
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            )}
                            <p className="text-xs text-slate-400 leading-relaxed">{reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Financial Health Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6">
                       <div className="flex items-center justify-between mb-6">
                         <h3 className="font-bold text-slate-200 text-xs uppercase tracking-widest text-primary-500">Financial Health</h3>
                         <TrendingUp className="w-4 h-4 text-slate-500" />
                       </div>
                       <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={ratioData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <Tooltip 
                               cursor={{fill: 'rgba(37,99,235,0.05)'}}
                               contentStyle={{ background: "#0f2342", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 12 }}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                              {ratioData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? "#ef4444" : "#2563eb"} />
                              ))}
                            </Bar>
                          </BarChart>
                       </ResponsiveContainer>
                       <div className="grid grid-cols-3 gap-2 mt-4">
                          {ratioData.map((r) => (
                            <div key={r.name} className="text-center">
                              <p className="text-[10px] font-bold text-slate-500 uppercase">{r.name}</p>
                              <p className="text-sm font-bold text-white">{r.label}</p>
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* WOW Feature: Indian Intelligence Panel */}
                    <div className="glass-card p-6 bg-primary-500/[0.02]">
                       <h3 className="font-bold text-slate-200 mb-4 text-xs uppercase tracking-widest text-primary-500">Indian Financial Intel</h3>
                       <div className="space-y-4">
                          {[
                            { label: "MCA Director Check", val: scoreData.indian_intel?.mca_director_check, icon: Building2 },
                            { label: "GST Compliance", val: scoreData.indian_intel?.gst_compliance, icon: FileText },
                            { label: "Simulated CIBIL", val: scoreData.indian_intel?.cibil_simulation, icon: ShieldCheck },
                          ].map((item, i) => (
                            <div key={i} className="flex flex-col gap-1 border-b border-slate-800 pb-2 last:border-0">
                               <span className="text-[10px] font-bold text-slate-500 uppercase">{item.label}</span>
                               <span className="text-xs text-slate-300 font-medium">{item.val}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dimension Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {radarData.map(({ label, score }) => (
                  <div key={label} className="glass-card p-4 hover:border-primary-500/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                       <span className="font-bold text-slate-300 text-xs">{label}</span>
                       <span className="text-sm font-black text-white">{score.toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1">
                      <div className="h-1 rounded-full bg-primary-500" style={{ width: `${score}%` }} />
                    </div>
                    <p className="text-[9px] text-slate-500 mt-2 leading-tight uppercase font-bold">{FIVE_C_DESCRIPTIONS[label]}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-center flex-col items-center gap-4 py-8">
                <a href="/report" className="btn-primary flex items-center gap-3 px-10 py-5 text-xl font-bold shadow-2xl shadow-primary-500/20">
                  <FileText className="w-6 h-6" /> Generate Official CAM Report
                </a>
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3" /> Report grounded in verified document & web research
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Extra icons needed
import { Building2, FileText, ShieldCheck } from "lucide-react";
