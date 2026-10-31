"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import api from "@/lib/api/client";
import { AnalyticsOverview, WardStat, DepartmentStat, HotspotItem } from "@/lib/types";
import AadhiraiBrandLogo from "@/components/AadhiraiBrandLogo";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  LayoutDashboard,
  Users,
  Building2,
  MapPin,
  FileCheck2,
  TrendingUp,
  Settings,
  LogOut,
  Bell,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<AnalyticsOverview>("/analytics/overview")
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <ProtectedRoute allowedRoles={["admin"]} portalTitle="Municipal Admin Portal">
      <div className="min-h-screen bg-[#F4F8FC] flex font-sans">
        {/* ============================================================== */}
        {/* LEFT NAVY SIDEBAR MATCHING REFERENCE IMAGE 2                   */}
        {/* ============================================================== */}
        <aside className="w-64 bg-[#082D50] text-white hidden md:flex flex-col justify-between p-5 shrink-0 border-r border-[#062038]">
          <div className="space-y-6">
            <div className="px-2">
              <AadhiraiBrandLogo size="md" variant="white" />
            </div>

            <nav className="space-y-1 text-xs font-semibold">
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 text-white font-bold transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-teal-300" />
                <span>Dashboard</span>
              </Link>

              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                <Users className="w-4 h-4" />
                <span>User Management</span>
              </div>

              <Link
                href="/admin/departments"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <span>Departments</span>
              </Link>

              <Link
                href="/admin/wards"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span>Wards & Jurisdiction</span>
              </Link>

              <Link
                href="/admin/verification"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Complaint Management</span>
              </Link>

              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                <TrendingUp className="w-4 h-4" />
                <span>Analytics</span>
              </div>

              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                <Settings className="w-4 h-4" />
                <span>System Settings</span>
              </div>
            </nav>
          </div>

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={logout}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ============================================================== */}
        {/* MAIN ADMIN CONTENT MATCHING REFERENCE IMAGE 2                  */}
        {/* ============================================================== */}
        <main className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Admin Dashboard
              </h1>
              <p className="text-xs text-slate-500">
                Municipal Corporation Command & Transparency Center
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                MC
              </div>
              <div className="hidden sm:block text-left text-xs">
                <div className="font-bold text-slate-800">
                  {user?.full_name || "Municipal Commissioner"}
                </div>
                <span className="text-[10px] text-teal-600 font-semibold">
                  Administrator
                </span>
              </div>
            </div>
          </div>

          {/* 4 Metric Cards matching Reference 2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Complaints: 2,418 */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">Total Complaints</span>
                <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                  +12%
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">2,418</div>
            </div>

            {/* Resolved: 2,362 */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">Resolved</span>
                <span className="text-[11px] font-bold text-emerald-600">98%</span>
              </div>
              <div className="text-2xl font-black text-emerald-600">2,362</div>
            </div>

            {/* Pending: 56 */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">Pending</span>
                <span className="text-[11px] font-bold text-amber-600">2%</span>
              </div>
              <div className="text-2xl font-black text-amber-600">56</div>
            </div>

            {/* Overdue: 24 */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">Overdue</span>
                <span className="text-[11px] font-bold text-red-600">1%</span>
              </div>
              <div className="text-2xl font-black text-red-600">24</div>
            </div>
          </div>

          {/* 3 Visual Analytics Cards matching Reference Image 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 1. Complaints by Category (Donut Chart) */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Complaints by Category
              </h3>

              <div className="flex items-center justify-center py-2">
                {/* Visual SVG Donut */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" stroke="#3B82F6" strokeWidth="12" fill="none" strokeDasharray="76 162" strokeDashoffset="0" />
                    <circle cx="50" cy="50" r="38" stroke="#10B981" strokeWidth="12" fill="none" strokeDasharray="57 181" strokeDashoffset="-76" />
                    <circle cx="50" cy="50" r="38" stroke="#F59E0B" strokeWidth="12" fill="none" strokeDasharray="43 195" strokeDashoffset="-133" />
                    <circle cx="50" cy="50" r="38" stroke="#8B5CF6" strokeWidth="12" fill="none" strokeDasharray="33 205" strokeDashoffset="-176" />
                    <circle cx="50" cy="50" r="38" stroke="#06B6D4" strokeWidth="12" fill="none" strokeDasharray="19 219" strokeDashoffset="-209" />
                    <circle cx="50" cy="50" r="38" stroke="#CBD5E1" strokeWidth="12" fill="none" strokeDasharray="10 228" strokeDashoffset="-228" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-slate-900 leading-none">2,418</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Total</span>
                  </div>
                </div>
              </div>

              {/* Legend matching Reference 2 */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Road Damage
                  </span>
                  <span className="font-bold text-slate-800">32%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Garbage
                  </span>
                  <span className="font-bold text-slate-800">24%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Drainage
                  </span>
                  <span className="font-bold text-slate-800">18%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Streetlight
                  </span>
                  <span className="font-bold text-slate-800">14%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    Water Leak
                  </span>
                  <span className="font-bold text-slate-800">8%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    Others
                  </span>
                  <span className="font-bold text-slate-800">4%</span>
                </div>
              </div>
            </div>

            {/* 2. Monthly Trend (Bar Chart) */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Monthly Trend
              </h3>

              <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
                {[
                  { month: "Jan", height: "45%" },
                  { month: "Feb", height: "60%" },
                  { month: "Mar", height: "85%" },
                  { month: "Apr", height: "55%" },
                  { month: "May", height: "90%" },
                  { month: "Jun", height: "70%" },
                ].map((bar) => (
                  <div key={bar.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div
                      className="w-full bg-[#075CE5] rounded-t-lg transition-all hover:bg-blue-600"
                      style={{ height: bar.height }}
                    />
                    <span className="text-[11px] font-bold text-slate-500">
                      {bar.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Department Performance (SLA Progress Bars) */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Department Performance
              </h3>

              <div className="space-y-4 pt-2">
                {[
                  { name: "Roads Dept", percent: 96, color: "bg-emerald-500" },
                  { name: "Sanitation Dept", percent: 92, color: "bg-teal-500" },
                  { name: "Electrical Dept", percent: 95, color: "bg-blue-500" },
                  { name: "Water Supply", percent: 88, color: "bg-amber-500" },
                ].map((dept) => (
                  <div key={dept.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">{dept.name}</span>
                      <span className="font-extrabold text-slate-900">{dept.percent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full ${dept.color} rounded-full`}
                        style={{ width: `${dept.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
