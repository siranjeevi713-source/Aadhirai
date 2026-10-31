import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/context";
import { AuthProvider } from "@/lib/auth/context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AADHIRAI (ஆதிரை) — AI-Powered Civic Accountability Engine",
  description:
    "Complaints don't end at submit. They end at proof. Musiri Municipality, Tamil Nadu CivicTech Grievance Redressal Platform.",
};

import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ta">
      <body className={`${inter.className} min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white`}>
        <LanguageProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <Navbar />
            </Suspense>
            <main className="flex-1 flex flex-col">
              <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">ஏற்றப்படுகிறது...</div>}>
                {children}
              </Suspense>
            </main>
            <Footer />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
