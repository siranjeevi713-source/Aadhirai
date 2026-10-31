"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import api from "@/lib/api/client";
import { Complaint } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import ProtectedRoute from "@/components/ProtectedRoute";
import AadhiraiBrandLogo from "@/components/AadhiraiBrandLogo";
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronRight,
  Search,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
} from "lucide-react";

const CITIZEN_NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/citizen" },
  { label: "Report a Problem", icon: PlusCircle, href: "/citizen/submit" },
  { label: "My Complaints", icon: FileText, href: "/citizen/complaints", active: true },
  { label: "Notifications", icon: Bell, href: "/citizen/notifications", badge: 9 },
  { label: "Profile", icon: User, href: "/citizen/profile" },
  { label: "Settings", icon: Settings, href: "/citizen/settings" },
];

const STATUS_FILTERS = [
  { value: "ALL", label: "All Complaints" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "VERIFIED_RESOLVED", label: "Resolved" },
  { value: "DISPUTED", label: "Disputed" },
];

export default function CitizenComplaintsListPage() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api.get<Complaint[]>("/complaints")
      .then((data) => {
        setComplaints(data);
        setFilteredComplaints(data);
      })
      .catch(() => {
        setComplaints([]);
        setFilteredComplaints([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    let list = complaints;
    if (statusFilter !== "ALL") {
      list = list.filter((c) => c.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.public_reference.toLowerCase().includes(q) ||
          (c.address_text && c.address_text.toLowerCase().includes(q))
      );
    }
    setFilteredComplaints(list);
  }, [statusFilter, searchQuery, complaints]);

  const initials = user?.full_name
    ? user.full_name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "C";

  return (
    <ProtectedRoute allowedRoles={["citizen"]} portalTitle="My Complaints">
      <div className="flex h-screen overflow-hidden bg-[#F4F8FC]">

        {/* ── Navy Left Sidebar ── */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#082D50] text-white">
          <div className="px-5 py-5 border-b border-white/10">
            <AadhiraiBrandLogo size="sm" variant="white" />
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {CITIZEN_NAV.map(({ label, icon: Icon, href, active, badge }) => {
              const isActive = active || pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
                      ? "bg-[#075CE5] text-white shadow-md"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className="h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                      {badge}
                    </span>
                  )}
                  {isActive && !badge && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-[#13C6B5] text-[#082D50] font-extrabold text-xs flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.full_name || "Citizen"}</p>
                <p className="text-[10px] text-slate-400 truncate">Verified Citizen</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-white/10 hover:text-white transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="bg-white border-b border-[#DCE6F0] px-6 py-3.5 flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-base font-bold text-[#082D50]">My Complaints</h1>
              <p className="text-[11px] text-slate-500">
                Complete history of your civic grievances in Musiri Municipality
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/citizen/submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#075CE5] hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Report a Problem
              </Link>
              <div className="h-8 w-8 rounded-full bg-[#13C6B5] text-[#082D50] font-extrabold text-xs flex items-center justify-center">
                {initials}
              </div>
            </div>
          </header>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Search + Filters */}
            <div className="bg-white rounded-2xl border border-[#DCE6F0] shadow-sm p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by reference number or title..."
                    className="w-full rounded-xl border border-[#DCE6F0] bg-[#F4F8FC] pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#075CE5] focus:outline-none focus:bg-white transition"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {STATUS_FILTERS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setStatusFilter(value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${statusFilter === value
                          ? "bg-[#075CE5] text-white shadow-sm"
                          : "bg-[#F4F8FC] text-slate-600 border border-[#DCE6F0] hover:border-[#075CE5] hover:text-[#075CE5]"
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Complaints Grid */}
            {loading ? (
              <div className="bg-white rounded-2xl border border-[#DCE6F0] p-12 text-center text-xs text-slate-400">
                Loading your complaints...
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#DCE6F0] p-12 text-center space-y-3">
                <FileText className="h-12 w-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-sm text-slate-700">No matching complaints found</h3>
                <p className="text-xs text-slate-500">Try adjusting your search or filter.</p>
                <Link
                  href="/citizen/submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#075CE5] text-white font-bold text-xs shadow-sm hover:bg-blue-700 transition-all"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Report a Problem
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredComplaints.map((c) => (
                  <Link
                    key={c.id}
                    href={`/citizen/complaints/${c.id}`}
                    className="group bg-white rounded-2xl border border-[#DCE6F0] hover:border-[#075CE5] hover:shadow-md transition-all flex flex-col justify-between p-5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-[11px] font-bold text-[#075CE5]">
                          {c.public_reference}
                        </span>
                        <StatusBadge status={c.status} size="sm" />
                      </div>
                      <h3 className="font-bold text-[#082D50] text-sm group-hover:text-[#075CE5] transition-colors line-clamp-2">
                        {c.title}
                      </h3>
                      <div className="space-y-1.5 mt-3 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{c.ward_name || c.address_text || "Musiri Municipality"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>Reported: {new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                        {c.due_at && (
                          <div className="flex items-center gap-1.5 text-[#075CE5] font-semibold">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>Due: {new Date(c.due_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#F4F8FC] flex items-center justify-between text-xs font-bold text-[#075CE5] group-hover:translate-x-1 transition-transform">
                      <span>View Details</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
