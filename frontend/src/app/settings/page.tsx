"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [backendUrl, setBackendUrl] = useState("http://127.0.0.1:8000");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }
    const saved =
      localStorage.getItem("credintel_backend_url") ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "http://127.0.0.1:8000";
    setBackendUrl(saved);
  }, [loading, user, router]);

  if (loading || !user) return null;

  const save = () => {
    localStorage.setItem("credintel_backend_url", backendUrl.trim());
    toast.success("Backend URL saved. Reload page to apply to all tabs.");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <Sidebar />
      <main className="ml-60 pt-16 p-8">
        <div className="max-w-2xl">
          <div className="mb-8">
            <h1 className="section-title text-3xl">Settings</h1>
            <p className="section-subtitle">Configure app connection parameters</p>
          </div>

          <div className="glass-card p-6 space-y-4">
            <label className="text-sm font-medium text-slate-300 block">
              Backend Base URL
            </label>
            <input
              className="input-field"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="http://127.0.0.1:8000"
            />
            <p className="text-xs text-slate-500">
              Used for Upload, Research, Risk, and CAM APIs.
            </p>
            <button onClick={save} className="btn-primary">
              Save
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
