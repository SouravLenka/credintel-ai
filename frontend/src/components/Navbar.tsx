"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { signOutUser } from "@/lib/firebase";
import { Brain, LogOut, User, Bell } from "lucide-react";
import toast from "react-hot-toast";

export default function Navbar() {
  const { user } = useAuth();
  const router   = useRouter();

  const handleSignOut = async () => {
    await signOutUser();
    toast.success("Signed out");
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-glass bg-navy-950/80 border-b border-primary-600/10">
      <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white">
            Cred<span className="text-primary-400">Intel</span>
            <span className="text-xs font-normal text-primary-500 ml-1">AI</span>
          </span>
        </Link>

        {/* Right */}
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-navy-800/50 transition-all">
            <Bell className="w-5 h-5" />
          </button>
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full border border-primary-600/40" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className="text-sm text-slate-300 hidden md:block">{user.displayName || user.email}</span>
              </div>
              <button onClick={handleSignOut} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
