"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import api from "@/lib/api/client";
import { PublicProof } from "@/lib/types";
import {
  ShieldCheck,
  FileCheck2,
  MapPin,
  Calendar,
  Clock,
  Search,
  Lock,
  QrCode,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function PublicProofPage({ params }: { params: Promise<{ reference: string }> }) {
  const resolvedParams = use(params);
  const reference = resolvedParams.reference;

  const { t } = useTranslation();
  const router = useRouter();

  const [proof, setProof] = useState<PublicProof | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchRef, setSearchRef] = useState("");

  useEffect(() => {
    fetchProof();
  }, [reference]);

  const fetchProof = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<PublicProof>(`/public/proof/${reference}`);
      setProof(data);
    } catch (err: any) {
      setError(err.message || "சான்று காணப்படவில்லை அல்லது இன்னும் சரிபார்க்கப்படவில்லை.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchRef.trim()) {
      router.push(`/proof/${searchRef.trim()}`);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span>டிஜிட்டல் வெளிப்படைத்தன்மை சான்றிதழ்</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.publicProofTitle}
          </h1>
          <p className="text-xs text-teal-100 max-w-xl">
            முசிறி நகராட்சியில் பொதுமக்கள் குறைகள் ஆதாரங்களுடன் தீர்க்கப்பட்டதற்கான சரிபார்க்கப்பட்ட சான்று.
          </p>
        </div>

        {/* Quick Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            placeholder="எ.கா: ADH-2026-MSR-0001"
            className="rounded-xl border border-teal-500 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-teal-200 focus:outline-none focus:ring-1 focus:ring-white"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-white text-teal-900 font-bold text-xs hover:bg-teal-50 transition-colors"
          >
            தேடு
          </button>
        </form>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
          பொதுச் சான்று விவரங்கள் ஏற்றப்படுகின்றன...
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="h-12 w-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            பொதுச் சான்று இன்னும் வெளியாகவில்லை
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {error} (குறைகள் முழுமையாகக் களப்பணி முடிந்து, பட மறுபயன்பாட்டுச் சோதனை மற்றும் தணிக்கையாளர் ஒப்புதல் பெற்ற பின்னரே பொதுச் சான்று வெளியிடப்படும்.)
          </p>
          <Link
            href="/"
            className="inline-flex px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
          >
            முகப்பிற்குத் திரும்பு
          </Link>
        </div>
      ) : proof ? (
        <div className="space-y-6">
          {/* Main Proof Certificate Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-emerald-500 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <span className="font-mono text-sm font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                  {proof.public_reference}
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-2">
                  {proof.category_name}
                </h2>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{proof.ward_name}</span>
                </p>
              </div>

              {/* Verified Badge */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs self-start sm:self-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>சரிபார்க்கப்பட்ட தீர்வு (VERIFIED PROOF)</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs">
              <div>
                <span className="text-slate-400 text-[10px]">பதிவு செய்யப்பட்ட நாள்:</span>
                <p className="font-bold text-slate-800 dark:text-white">
                  {new Date(proof.submitted_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">தீர்வு நாள்:</span>
                <p className="font-bold text-emerald-600">
                  {new Date(proof.resolved_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">தீர்வு நேரம்:</span>
                <p className="font-bold text-indigo-600">
                  {proof.turnaround_hours} மணிநேரம்
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">தோராய இருப்பிடம்:</span>
                <p className="font-mono text-slate-700 dark:text-slate-300">
                  {proof.approximate_lat}, {proof.approximate_lon}
                </p>
              </div>
            </div>

            {/* Before / After Images */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  முந்தைய நிலை (Before Repair)
                </span>
                <div className="rounded-2xl overflow-hidden border border-slate-200">
                  <img src={proof.before_image_url} alt="Before Repair" className="w-full h-56 object-cover" />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  சரிசெய்யப்பட்ட நிலை (After Repair)
                </span>
                <div className="rounded-2xl overflow-hidden border border-slate-200">
                  <img src={proof.after_image_url} alt="After Repair" className="w-full h-56 object-cover" />
                </div>
              </div>
            </div>

            {/* Audit Summary & QR Code */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200">
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  சுயாதீன சரிபார்ப்பு தணிக்கைச் சுருக்கம்
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  {proof.verification_summary}
                </p>
              </div>

              {/* QR Verification Card */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-300 shadow-sm flex flex-col items-center justify-center shrink-0">
                <QrCode className="h-16 w-16 text-emerald-700 dark:text-emerald-400" />
                <span className="text-[10px] font-mono text-slate-500 mt-1">
                  {proof.public_reference}
                </span>
              </div>
            </div>
          </div>

          {/* Privacy Protection Notice */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-3">
            <Lock className="h-5 w-5 text-indigo-600 shrink-0" />
            <p>{t.privacyNotice}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
