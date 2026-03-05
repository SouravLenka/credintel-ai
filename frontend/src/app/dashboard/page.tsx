"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  BarChart3, FileText, Upload, Search, TrendingUp, AlertTriangle, CheckCircle, Clock,
} from "lucide-react";

const stats = [
  { label: "Analyses Run",       value: "0",          icon: BarChart3,     color: "text-primary-400" },
  { label: "Docs Uploaded",      value: "0",          icon: Upload,        color: "text-blue-400"    },
  { label: "Reports Generated",  value: "0",          icon: FileText,      color: "text-green-400"   },
  { label: "Risk Flags Found",   value: "0",          icon: AlertTriangle, color: "text-yellow-400"  },
];

const quickActions = [
  { href: "/upload",   label: "Upload Documents", icon: Upload,    desc: "Add financial docs" },
  { href: "/research", label: "Research Company", icon: Search,    desc: "Automated web research" },
  { href: "/risk",     label: "Score Risk",       icon: BarChart3, desc: "Five-Cs analysis" },
  { href: "/report",   label: "Generate CAM",     icon: FileText,  desc: "Credit Appraisal Memo" },
];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  if (loading) return <LoadingScreen />;
  if (!user)   return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <Sidebar />
      <main className="ml-60 pt-16 p-8 min-h-screen">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, <span className="text-primary-400">{user.displayName?.split(" ")[0] || "Analyst"}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1">Here&apos;s your credit analytics overview.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-card animate-slide-up">
              <Icon className={`w-6 h-6 ${color}`} />
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="section-title mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map(({ href, label, icon: Icon, desc }) => (
              <a key={href} href={href} className="glass-card p-5 hover:border-primary-500/50 hover:shadow-glow transition-all duration-200 group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center mb-3 group-hover:bg-primary-600/30 transition-all">
                  <Icon className="w-5 h-5 text-primary-400" />
                </div>
                <p className="font-semibold text-slate-200 text-sm">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="glass-card p-6">
          <h2 className="section-title mb-4">Recent Analyses</h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-slate-400 font-medium">No analyses yet</p>
            <p className="text-slate-500 text-sm mt-1">Upload documents and run your first analysis.</p>
            <a href="/upload" className="btn-primary mt-4 text-sm">Get started →</a>
          </div>
        </div>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-hero-gradient">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center animate-pulse shadow-glow">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <p className="text-slate-400">Loading CredIntel AI…</p>
      </div>
    </div>
  );
}
