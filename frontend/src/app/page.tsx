"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import api from "@/lib/api/client";
import { AnalyticsOverview } from "@/lib/types";
import {
  ShieldCheck,
  PlusCircle,
  FileCheck2,
  Users,
  HardHat,
  LayoutDashboard,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Layers,
} from "lucide-react";

export default function HomePage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AnalyticsOverview>("/analytics/overview")
      .then((data) => setStats(data))
      .catch(() => {
        // Fallback baseline for initial fresh state
        setStats({
          total_complaints: 0,
          pending_complaints: 0,
          in_progress_complaints: 0,
          resolved_complaints: 0,
          reopened_complaints: 0,
          escalated_complaints: 0,
          sla_compliance_rate: 100.0,
          average_resolution_hours: 0.0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
        
        <div className="relative mx-auto max-w-5xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>{t.pilotBadge} — 24 நகராட்சி வார்டுகள்</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            {t.brandName}
            <span className="block text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-teal-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent mt-2">
              AI-Powered Civic Accountability Engine
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            &ldquo;{t.tagline}&rdquo;
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/citizen/submit"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-[1.02] transition-all"
            >
              <PlusCircle className="h-5 w-5" />
              <span>{t.submitComplaint}</span>
            </Link>

            <Link
              href="/proof/ADH-2026-MSR-0001"
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 backdrop-blur-md px-6 py-3.5 text-sm font-bold text-slate-200 hover:bg-slate-700/80 hover:text-white transition-all"
            >
              <FileCheck2 className="h-5 w-5 text-emerald-400" />
              <span>{t.publicProof}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Metrics Grid from Real Database */}
      <section className="relative -mt-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 z-10 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">{t.totalGrievances}</span>
              <Layers className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {loading ? "..." : stats?.total_complaints || 0}
            </p>
            <span className="text-[10px] text-slate-400">Database Live Records</span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">{t.activeRepairs}</span>
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              {loading ? "..." : stats?.in_progress_complaints || 0}
            </p>
            <span className="text-[10px] text-slate-400">Active Field Operations</span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">{t.verifiedResolutions}</span>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {loading ? "..." : stats?.resolved_complaints || 0}
            </p>
            <span className="text-[10px] text-slate-400">Dual pHash Verified</span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">{t.slaCompliance}</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {loading ? "..." : `${stats?.sla_compliance_rate || 100}%`}
            </p>
            <span className="text-[10px] text-slate-400">On-Time Redressal</span>
          </div>
        </div>
      </section>

      {/* The Four Dedicated Portals */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            நான்கு பிரத்யேக தளப் பிரிவுகள் (Dedicated Portals)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            குடிமக்கள், கள அலுவலர்கள், ஆணையர் மற்றும் பொதுமக்களுக்கான தனிப்பயனாக்கப்பட்ட பணித்தளங்கள்.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Citizen Portal Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 dark:bg-blue-950/50">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {t.citizenPortal}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                புகார் பதிவு, ஜி.பி.எஸ் இருப்பிடம், நிகழ்நேர SLA கண்காணிப்பு மற்றும் தீர்வுத் திருப்தி மதிப்பீடு.
              </p>
            </div>
            <Link
              href="/citizen"
              className="inline-flex items-center justify-between text-xs font-bold text-blue-600 hover:text-blue-700 pt-3 border-t border-slate-100 dark:border-slate-800"
            >
              <span>தளம் செல்க</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Officer Portal Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 dark:bg-purple-950/50">
                <HardHat className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {t.officerPortal}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                வார்டு பொறியாளர்களுக்கான பணிப் பட்டியல், Work Order உருவாக்கம் மற்றும் தீர்வுக்கான புகைப்படப் பதிவேற்றம்.
              </p>
            </div>
            <Link
              href="/officer"
              className="inline-flex items-center justify-between text-xs font-bold text-purple-600 hover:text-purple-700 pt-3 border-t border-slate-100 dark:border-slate-800"
            >
              <span>தளம் செல்க</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Admin Portal Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 dark:bg-amber-950/50">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {t.adminPortal}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                நகராட்சி ஆணையர் கட்டளை மையம், வார்டு பகுப்பாய்வு, ஹாட்ஸ்பாட் வரைபடம் மற்றும் தணிக்கைப் பதிவுகள்.
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center justify-between text-xs font-bold text-amber-600 hover:text-amber-700 pt-3 border-t border-slate-100 dark:border-slate-800"
            >
              <span>தளம் செல்க</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Public Proof Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 dark:bg-emerald-950/50">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {t.publicProof}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                சரிபார்க்கப்பட்ட தீர்வுக்கான முன்/பின் புகைப்படங்கள், QR குறியீடு மற்றும் வெளிப்படையான பொதுச் சான்று.
              </p>
            </div>
            <Link
              href="/proof/ADH-2026-MSR-0001"
              className="inline-flex items-center justify-between text-xs font-bold text-emerald-600 hover:text-emerald-700 pt-3 border-t border-slate-100 dark:border-slate-800"
            >
              <span>சான்று காண்க</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* The 7-Step Accountability Pipeline */}
      <section className="bg-slate-100 dark:bg-slate-900/50 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              பொறுப்புடைமை செயல்முறை (The Accountability Pipeline)
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              REPORT → CLASSIFY → ROUTE → TRACK → ESCALATE → VERIFY → PUBLIC PROOF
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-indigo-600">01. புகார் (Report)</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">குடிமகன் பதிவு</h4>
              <p className="text-xs text-slate-500 mt-1">புகைப்படம், ஜி.பி.எஸ் மற்றும் தமிழ்/ஆங்கில விவரிப்புடன் நேரடி பதிவு.</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-indigo-600">02. பகுப்பாய்வு (Classify & Route)</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">ஹைபிரிட் AI & வார்டு</h4>
              <p className="text-xs text-slate-500 mt-1">Gemini மற்றும் YOLO மூலம் துறை வகைப்பாடு; 24 வார்டுகளுக்குள் துல்லிய ஒதுக்கீடு.</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-indigo-600">03. தீர்வு (Work & Resolve)</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">களப்பணி & சான்று</h4>
              <p className="text-xs text-slate-500 mt-1">பொறியாளர் வேலை உத்தரவு மற்றும் பணி முடிந்த பின் புதிய புகைப்படச் சான்று.</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-indigo-600">04. சரிபார்ப்பு (Public Proof)</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">டிஜிட்டல் உறுதிப்பாடு</h4>
              <p className="text-xs text-slate-500 mt-1">pHash மறுபயன்பாட்டு ஆய்வு, பொதுமக்கள் பார்வைக்கான QR குறியீட்டு சான்றிதழ்.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
