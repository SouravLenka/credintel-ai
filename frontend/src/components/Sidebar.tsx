"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Upload, Search, BarChart3, FileText, Settings,
} from "lucide-react";
import { clsx } from "clsx";

const links = [
  { href: "/dashboard",  label: "Dashboard",   icon: LayoutDashboard },
  { href: "/upload",     label: "Upload Docs",  icon: Upload          },
  { href: "/research",   label: "Research",     icon: Search          },
  { href: "/risk",       label: "Risk Score",   icon: BarChart3       },
  { href: "/report",     label: "CAM Report",   icon: FileText        },
  { href: "/settings",   label: "Settings",     icon: Settings        },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-60 bg-navy-950/80 backdrop-blur-glass border-r border-primary-600/10 flex flex-col py-6 px-3">
      <nav className="flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200",
                active
                  ? "bg-primary-600/20 text-primary-400 border border-primary-600/30 shadow-glow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-navy-800/50"
              )}
            >
              <Icon className={clsx("w-5 h-5", active ? "text-primary-400" : "text-slate-500")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom badge */}
      <div className="mt-auto px-4">
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-slate-400 font-medium">CredIntel AI</p>
          <p className="text-xs text-primary-500">v1.0.0 — Hackathon</p>
        </div>
      </div>
    </aside>
  );
}
