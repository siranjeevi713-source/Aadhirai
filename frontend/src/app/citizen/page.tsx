"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import api from "@/lib/api/client";
import { Complaint } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

export default function CitizenDashboardPage() {
  const { t } = useTranslation();
  const { user, quickLoginAs } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Complaint[]>("/complaints")
      .then((data) => setComplaints(data))
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  }, [user]);

  const total = complaints.length;
  const pending = complaints.filter((c) => ["SUBMITTED", "ASSIGNED"].includes(c.status)).length;
  const inProgress = complaints.filter((c) => c.status === "IN_PROGRESS").length;
  const resolved = complaints.filter((c) => c.status === "VERIFIED_RESOLVED").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">
            <span>முசிறி நகராட்சி தளம்</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            வணக்கம், {user ? user.full_name : "குடிமகன் (Citizen)"}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            உங்கள் பகுதி பொதுப் பிரச்சனைகளை ஆதாரத்துடன் பதிவு செய்து, தீர்வு நிலையை நிகழ்நேரத்தில் கண்காணிக்கலாம்.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/citizen/submit"
            className="flex items-center gap-2 rounded-xl bg-white text-indigo-700 px-5 py-3 text-xs sm:text-sm font-bold shadow-md hover:bg-blue-50 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t.submitComplaint}</span>
          </Link>
        </div>
      </div>

      {!user && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <span>தற்போது நீங்கள் விருந்தினர் முறையில் உள்ளீர்கள். உங்கள் புகார்களைப் பார்க்க உள்நுழையவும்.</span>
          </div>
          <button
            onClick={() => quickLoginAs("citizen")}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
          >
            குடிமகன் உள்நுழைவு
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t.totalGrievances}</span>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {loading ? "..." : total}
          </p>
          <span className="text-[10px] text-slate-400">பதிவு செய்த புகார்கள்</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-semibold">{t.pendingAction}</span>
            <Clock className="h-4 w-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">
            {loading ? "..." : pending}
          </p>
          <span className="text-[10px] text-slate-400">அலுவலர் ஒதுக்கீட்டில்</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold">{t.activeRepairs}</span>
            <FileText className="h-4 w-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-600">
            {loading ? "..." : inProgress}
          </p>
          <span className="text-[10px] text-slate-400">களப்பணி நடப்பில்</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold">{t.verifiedResolutions}</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {loading ? "..." : resolved}
          </p>
          <span className="text-[10px] text-slate-400">சான்றுடன் தீர்க்கப்பட்டது</span>
        </div>
      </div>

      {/* Recent Complaints Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              சமீபத்திய புகார்கள் (Recent Grievances)
            </h2>
            <p className="text-xs text-slate-500">
              நேரடி தரவுத்தளத்திலிருந்து பெறப்பட்ட உங்கள் பகுதி புகார்கள்
            </p>
          </div>
          <Link
            href="/citizen/complaints"
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            <span>அனைத்தையும் காண்க</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            புகார்கள் ஏற்றப்படுகின்றன...
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">
              புகார்கள் ஏதும் இதுவரை இல்லை
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              உங்கள் பகுதியில் சாலை, விளக்கு, குடிநீர் அல்லது வடிகால் குறைபாடுகள் இருப்பின் உடனடியாகப் புகாரளிக்கவும்.
            </p>
            <Link
              href="/citizen/submit"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2 text-xs font-bold hover:bg-indigo-500"
            >
              <PlusCircle className="h-4 w-4" />
              <span>புதிய புகார் பதிவு செய்</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complaints.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                href={`/citizen/complaints/${c.id}`}
                className="group flex flex-col justify-between p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                      {c.public_reference}
                    </span>
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 transition-colors">
                    {c.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {c.ward_name || "முசிறி வார்டு"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                  <span>முழு விவரங்கள் காண்க</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
