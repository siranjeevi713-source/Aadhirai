"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import api from "@/lib/api/client";
import { AnalyticsOverview, WardStat, DepartmentStat, HotspotItem } from "@/lib/types";
import {
  LayoutDashboard,
  Building2,
  MapPin,
  FileCheck2,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileText,
  Flame,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { user, quickLoginAs } = useAuth();

  const [stats, setStats] = useState<AnalyticsOverview | null>(null);
  const [wards, setWards] = useState<WardStat[]>([]);
  const [departments, setDepartments] = useState<DepartmentStat[]>([]);
  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  const fetchAdminData = async () => {
    try {
      const [ov, w, d, h] = await Promise.all([
        api.get<AnalyticsOverview>("/analytics/overview"),
        api.get<WardStat[]>("/analytics/wards"),
        api.get<DepartmentStat[]>("/analytics/departments"),
        api.get<HotspotItem[]>("/analytics/hotspots"),
      ]);
      setStats(ov);
      setWards(w);
      setDepartments(d);
      setHotspots(h);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">
            <LayoutDashboard className="h-4 w-4" />
            <span>நகராட்சி ஆணையர் கட்டளை மையம் — முசிறி</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {user?.full_name || "ஆணையர் தர்மலிங்கம் (Commissioner Dharmalingam)"}
          </h1>
          <p className="text-xs text-amber-100">
            பொறுப்புடைமை மற்றும் வெளிப்படைத்தன்மை கண்காணிப்பு டாஷ்போர்டு
          </p>
        </div>

        {!user && (
          <button
            onClick={() => quickLoginAs("admin")}
            className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-md"
          >
            ஆணையராக உள்நுழைக
          </button>
        )}
      </div>

      {/* Quick Navigation Admin Toolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Link
          href="/admin/verification"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 shadow-sm flex flex-col items-center justify-center text-center space-y-2 group"
        >
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-white">தீர்வு சரிபார்ப்பு</span>
        </Link>

        <Link
          href="/admin/categories"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 shadow-sm flex flex-col items-center justify-center text-center space-y-2 group"
        >
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-white">துறை வகைகள்</span>
        </Link>

        <Link
          href="/admin/departments"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 shadow-sm flex flex-col items-center justify-center text-center space-y-2 group"
        >
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-white">துறைகள் & அலுவலர்</span>
        </Link>

        <Link
          href="/admin/wards"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 shadow-sm flex flex-col items-center justify-center text-center space-y-2 group"
        >
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MapPin className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-white">24 வார்டுகள்</span>
        </Link>

        <Link
          href="/admin/audit-logs"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 shadow-sm flex flex-col items-center justify-center text-center space-y-2 group"
        >
          <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-white">தணிக்கைப் பதிவுகள்</span>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500">{t.totalGrievances}</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {loading ? "..." : stats?.total_complaints || 0}
          </p>
          <span className="text-[10px] text-slate-400">தரவுத்தள பதிவுகள்</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-amber-600">{t.pendingAction}</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
            {loading ? "..." : stats?.pending_complaints || 0}
          </p>
          <span className="text-[10px] text-slate-400">நடவடிக்கை நிலுவை</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-emerald-600">{t.verifiedResolutions}</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
            {loading ? "..." : stats?.resolved_complaints || 0}
          </p>
          <span className="text-[10px] text-slate-400">சரிபார்க்கப்பட்டவை</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-indigo-600">{t.slaCompliance}</span>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">
            {loading ? "..." : `${stats?.sla_compliance_rate || 100}%`}
          </p>
          <span className="text-[10px] text-slate-400">காலக்கெடு இணக்க விகிதம்</span>
        </div>
      </div>

      {/* Department Performance & Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Performance */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-600" />
              <span>துறைசார் தீர்வு விகிதம் (Department Performance)</span>
            </h3>
          </div>

          <div className="space-y-3">
            {departments.map((d) => (
              <div key={d.department_name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{d.department_name}</span>
                  <span className="font-mono text-slate-500">
                    {d.resolved_count} / {d.total_assigned} ({d.compliance_rate}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
                    style={{ width: `${Math.max(5, d.compliance_rate)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hotspots */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="h-4 w-4 text-rose-600" />
              <span>மீண்டும் எழும் ஹாட்ஸ்பாட்கள் (Civic Hotspots)</span>
            </h3>
          </div>

          {hotspots.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">ஹாட்ஸ்பாட்கள் ஏதும் இதுவரை கண்டறியப்படவில்லை.</p>
          ) : (
            <div className="space-y-2">
              {hotspots.slice(0, 5).map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-xs"
                >
                  <div>
                    <p className="font-bold text-rose-900 dark:text-rose-200">{h.category_name}</p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {h.latitude}, {h.longitude}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-200 text-rose-800 font-bold text-[10px]">
                    {h.incident_count} சம்பவங்கள் ({h.severity})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Musiri 24 Wards Summary */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MapPin className="h-4 w-4 text-indigo-600" />
          <span>முசிறி 24 நகராட்சி வார்டுகள் நிலை (Ward-Level Performance)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
          {wards.slice(0, 12).map((w) => (
            <div
              key={w.ward_number}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1"
            >
              <div className="flex justify-between items-center font-bold">
                <span>வார்டு {w.ward_number}</span>
                <span className="text-indigo-600">{w.complaint_count} புகார்கள்</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{w.ward_name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
