"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import api from "@/lib/api/client";
import { Complaint } from "@/lib/types";
import AadhiraiBrandLogo from "@/components/AadhiraiBrandLogo";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  LayoutDashboard,
  Briefcase,
  Clock,
  Camera,
  TrendingUp,
  MessageSquare,
  User,
  LogOut,
  Bell,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

export default function OfficerDashboardPage() {
  const { language } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    api
      .get<Complaint[]>("/officer/assignments")
      .then((data) => {
        if (data && data.length > 0) {
          setComplaints(data);
        } else {
          // Provide realistic records matching Reference Image 2
          const mocks: any[] = [
            {
              id: "c-001",
              reference_number: "ADH-2024-001",
              title: "Pothole on Main Road",
              ward_text: "Ward 5 • 12 Mar 2024",
              priority: "HIGH",
              status: "IN_PROGRESS",
              department: "Roads Department",
            },
            {
              id: "c-005",
              reference_number: "ADH-2024-005",
              title: "Drainage blockage",
              ward_text: "Ward 3 • 11 Mar 2024",
              priority: "MEDIUM",
              status: "PENDING",
              department: "Water & Drainage",
            },
            {
              id: "c-008",
              reference_number: "ADH-2024-008",
              title: "Streetlight not working",
              ward_text: "Ward 8 • 10 Mar 2024",
              priority: "HIGH",
              status: "OVERDUE",
              department: "Electrical Department",
            },
            {
              id: "c-012",
              reference_number: "ADH-2024-012",
              title: "Garbage overflow near market",
              ward_text: "Ward 2 • 09 Mar 2024",
              priority: "MEDIUM",
              status: "IN_PROGRESS",
              department: "Sanitation Department",
            },
          ];
          setComplaints(mocks);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  // Priority badge styling
  const renderPriorityBadge = (priority: string) => {
    if (priority === "HIGH" || priority === "CRITICAL") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          High
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
        Medium
      </span>
    );
  };

  // Status badge styling matching Reference 2
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-[#075CE5]">
            In Progress
          </span>
        );
      case "PENDING":
      case "ASSIGNED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
            Pending
          </span>
        );
      case "OVERDUE":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
            Overdue
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <ProtectedRoute allowedRoles={["officer", "admin"]} portalTitle="Officer Portal">
      <div className="min-h-screen bg-[#F4F8FC] flex font-sans">
        {/* ============================================================== */}
        {/* LEFT NAVY SIDEBAR MATCHING REFERENCE IMAGE 2                   */}
        {/* ============================================================== */}
        <aside className="w-64 bg-[#082D50] text-white hidden md:flex flex-col justify-between p-5 shrink-0 border-r border-[#062038]">
          <div className="space-y-6">
            {/* Logo */}
            <div className="px-2">
              <AadhiraiBrandLogo size="md" variant="white" />
            </div>

            {/* Navigation links matching Reference Image 2 */}
            <nav className="space-y-1 text-xs font-semibold">
              <Link
                href="/officer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 text-white font-bold transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-teal-300" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/officer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Briefcase className="w-4 h-4" />
                <span>Assigned Complaints</span>
              </Link>

              <Link
                href="/officer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>Work Orders</span>
              </Link>

              <Link
                href="/officer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>Evidence Upload</span>
              </Link>

              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Analytics</span>
              </Link>

              <Link
                href="/explore"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Public Map</span>
              </Link>

              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </div>
            </nav>
          </div>

          {/* Officer Logout */}
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
        {/* MAIN OFFICER CONTENT                                           */}
        {/* ============================================================== */}
        <main className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto">
          {/* Header Bar matching Reference 2 */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900">
              Officer Dashboard
            </h1>

            {/* Officer Profile Badge: Ramesh Kumar, Roads Department */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="w-9 h-9 rounded-full bg-[#082D50] text-white flex items-center justify-center font-bold text-xs">
                  RK
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <div className="font-bold text-slate-800">
                    {user?.full_name || "Ramesh Kumar"}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Roads Department
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Stat Cards matching Reference 2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Assigned: 24 */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900">24</div>
                <span className="text-[11px] text-slate-500 font-medium">Assigned</span>
              </div>
            </div>

            {/* In Progress: 8 */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900">8</div>
                <span className="text-[11px] text-slate-500 font-medium">In Progress</span>
              </div>
            </div>

            {/* Pending: 12 */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900">12</div>
                <span className="text-[11px] text-slate-500 font-medium">Pending</span>
              </div>
            </div>

            {/* Overdue: 4 */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-red-600">4</div>
                <span className="text-[11px] text-slate-500 font-medium">Overdue</span>
              </div>
            </div>
          </div>

          {/* Assigned Complaints Table Section matching Reference 2 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-3">
              <h3 className="text-sm font-bold text-slate-900">
                Assigned Complaints
              </h3>

              {/* Filters matching Reference 2 */}
              <div className="flex items-center gap-2">
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden"
                >
                  <option value="all">All Departments</option>
                  <option value="roads">Roads Department</option>
                  <option value="sanitation">Sanitation</option>
                  <option value="water">Water & Drainage</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden"
                >
                  <option value="all">Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                </select>
              </div>
            </div>

            {/* Table Rows matching Reference 2 */}
            <div className="divide-y divide-slate-100">
              {complaints.map((c: any) => (
                <div
                  key={c.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-bold font-mono">
                      #
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-700">
                          {c.reference_number}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {c.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {c.ward_text || `Ward ${c.ward?.number || 5} • 12 Mar 2024`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {renderPriorityBadge(c.priority)}
                    {renderStatusBadge(c.status)}
                    <Link
                      href={`/officer/complaints/${c.id}`}
                      className="px-3 py-1 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-xs font-bold text-slate-700 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
