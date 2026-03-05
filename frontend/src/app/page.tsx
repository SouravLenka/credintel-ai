"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithGoogle } from "@/lib/firebase";
import { Brain, ArrowRight, Shield, Zap, FileText, BarChart3, Search } from "lucide-react";
import toast from "react-hot-toast";

const features = [
  { icon: Upload2,    title: "Document Ingestion",    desc: "PDF, CSV, Excel — auto-parsed and embedded into AI memory." },
  { icon: Search,     title: "Research Agent",        desc: "Automated web research: news, promoter checks, litigation scans." },
  { icon: BarChart3,  title: "Five-Cs Risk Scoring",  desc: "Explainable credit score across Character, Capacity, Capital, Collateral, Conditions." },
  { icon: FileText,   title: "CAM Generation",        desc: "Professional Credit Appraisal Memo in PDF & DOCX in seconds." },
  { icon: Shield,     title: "Secure & Compliant",    desc: "Firebase Google Auth. Data stays on your infrastructure." },
  { icon: Zap,        title: "Fast & Scalable",       desc: "FastAPI async backend + ChromaDB vector store. Deploy to Railway + Vercel." },
];

function Upload2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push("/dashboard");
  }, [user, loading, router]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch {
      toast.error("Sign-in failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="blob w-96 h-96 bg-primary-600 top-0 left-1/4" />
      <div className="blob w-80 h-80 bg-primary-800 bottom-20 right-10" style={{ animationDelay: "2s" }} />
      <div className="blob w-64 h-64 bg-blue-700 top-1/3 right-1/3" style={{ animationDelay: "4s" }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-glow">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white">
            Cred<span className="text-primary-400">Intel</span>
            <span className="text-xs font-normal text-primary-500 ml-1 uppercase tracking-widest">AI</span>
          </span>
        </div>
        <button onClick={handleLogin} className="btn-outline text-sm">
          Sign In
        </button>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-600/10 border border-primary-600/30 rounded-full px-4 py-1.5 text-primary-400 text-sm font-medium mb-8 animate-fade-in">
          <Zap className="w-4 h-4" />
          Powered by Groq LLaMA 3 · LangChain · ChromaDB
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight animate-slide-up mb-6">
          Intelligent Corporate<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-blue-300">
            Credit Decisions
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 animate-fade-in">
          Upload financial documents, get automated company research, calculate explainable
          Five-Cs credit scores, and generate professional Credit Appraisal Memos — all in one AI-powered platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
          <button onClick={handleLogin} className="btn-primary flex items-center gap-2 text-base">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <a href="#features" className="btn-outline flex items-center gap-2 text-sm">
            See Features <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-8 pb-24">
        <h2 className="text-3xl font-bold text-center text-white mb-12">
          Everything You Need for <span className="text-primary-400">Intelligent Credit</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card p-6 hover:border-primary-500/40 hover:shadow-glow transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-600/30 flex items-center justify-center mb-4 group-hover:bg-primary-600/30 transition-all">
                <Icon className="w-5 h-5 text-primary-400" />
              </div>
              <h3 className="font-semibold text-slate-200 mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-8 pb-24 text-center">
        <div className="glass-card p-10 animate-glow-pulse">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to get started?</h2>
          <p className="text-slate-400 mb-6">Join the future of corporate credit analysis.</p>
          <button onClick={handleLogin} className="btn-primary">
            Launch CredIntel AI →
          </button>
        </div>
      </section>

      <footer className="relative z-10 text-center py-6 text-slate-500 text-sm border-t border-primary-600/10">
        © 2025 CredIntel AI · Built for Hackathon · Powered by Groq + LangChain
      </footer>
    </div>
  );
}
