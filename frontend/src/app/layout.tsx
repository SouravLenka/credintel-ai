import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "CredIntel AI — Intelligent Corporate Credit Decision Engine",
  description:
    "AI-powered credit risk analysis: upload financial documents, get automated research, Five-Cs credit scoring, and professional CAM reports.",
  keywords: ["credit analysis", "AI", "risk scoring", "CAM", "corporate credit"],
  openGraph: {
    title: "CredIntel AI",
    description: "Intelligent Corporate Credit Decision Engine",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#0f2342",
                color: "#f1f5f9",
                border: "1px solid rgba(37,99,235,0.3)",
                borderRadius: "12px",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
