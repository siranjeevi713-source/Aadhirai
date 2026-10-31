"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useTranslation } from "@/lib/i18n/context";
import AadhiraiBrandLogo from "@/components/AadhiraiBrandLogo";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronRight,
  Phone,
  Mail,
  Globe,
  Shield,
  Edit3,
  CheckCircle2,
} from "lucide-react";

const CITIZEN_NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/citizen" },
  { label: "Report a Problem", icon: PlusCircle, href: "/citizen/submit" },
  { label: "My Complaints", icon: FileText, href: "/citizen/complaints" },
  { label: "Notifications", icon: Bell, href: "/citizen/notifications", badge: 9 },
  { label: "Profile", icon: User, href: "/citizen/profile", active: true },
  { label: "Settings", icon: Settings, href: "/citizen/settings" },
];

export default function CitizenProfilePage() {
  const { language, setLanguage } = useTranslation();
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const initials = user?.full_name
    ? user.full_name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "C";

  return (
    <ProtectedRoute allowedRoles={["citizen"]} portalTitle="Citizen Profile">
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
              <h1 className="text-base font-bold text-[#082D50]">Citizen Profile</h1>
              <p className="text-[11px] text-slate-500">Your account details and preferences</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-[#13C6B5] text-[#082D50] font-extrabold text-xs flex items-center justify-center">
              {initials}
            </div>
          </header>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl space-y-5">

              {/* Profile Card */}
              <div className="bg-white rounded-2xl border border-[#DCE6F0] shadow-sm p-6">
                <div className="flex items-center gap-5 pb-5 border-b border-[#F4F8FC]">
                  <div className="h-16 w-16 rounded-2xl bg-[#075CE5] text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-[#082D50]">
                      {user ? user.full_name : "Citizen User"}
                    </h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <Shield className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Verified Citizen Account</span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 ml-1" />
                    </p>
                  </div>
                  <button className="p-2 rounded-xl border border-[#DCE6F0] hover:bg-[#F4F8FC] text-slate-500 hover:text-[#075CE5] transition-all">
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                  <div className="p-4 rounded-xl bg-[#F4F8FC] border border-[#DCE6F0]">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                      <Phone className="h-3.5 w-3.5" /> Phone Number
                    </span>
                    <p className="font-bold text-[#082D50] text-sm">
                      {user?.phone || "+91 98765 43210"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F4F8FC] border border-[#DCE6F0]">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                      <Mail className="h-3.5 w-3.5" /> Email Address
                    </span>
                    <p className="font-bold text-[#082D50] text-sm">
                      {user?.email || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Language Preferences */}
              <div className="bg-white rounded-2xl border border-[#DCE6F0] shadow-sm p-6">
                <h3 className="text-xs font-bold text-[#082D50] uppercase tracking-wider flex items-center gap-2 mb-4">
                  <Globe className="h-4 w-4 text-[#075CE5]" />
                  Language Preference
                </h3>
                <div className="grid grid-cols-2 gap-3 max-w-xs">
                  <button
                    onClick={() => setLanguage("ta")}
                    className={`p-3.5 rounded-xl border text-xs font-bold transition-all ${language === "ta"
                        ? "border-[#075CE5] bg-blue-50 text-[#075CE5]"
                        : "border-[#DCE6F0] bg-[#F4F8FC] text-slate-600 hover:border-[#075CE5]"
                      }`}
                  >
                    🇮🇳 தமிழ்
                    <span className="block text-[10px] font-normal mt-0.5 text-slate-500">Tamil (Default)</span>
                  </button>
                  <button
                    onClick={() => setLanguage("en")}
                    className={`p-3.5 rounded-xl border text-xs font-bold transition-all ${language === "en"
                        ? "border-[#075CE5] bg-blue-50 text-[#075CE5]"
                        : "border-[#DCE6F0] bg-[#F4F8FC] text-slate-600 hover:border-[#075CE5]"
                      }`}
                  >
                    🇬🇧 English
                    <span className="block text-[10px] font-normal mt-0.5 text-slate-500">English</span>
                  </button>
                </div>
              </div>

              {/* Civic Stats */}
              <div className="bg-white rounded-2xl border border-[#DCE6F0] shadow-sm p-6">
                <h3 className="text-xs font-bold text-[#082D50] uppercase tracking-wider mb-4">
                  Your Civic Contribution
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: "Complaints Filed", value: "5", color: "text-[#075CE5]" },
                    { label: "Resolved", value: "2", color: "text-emerald-600" },
                    { label: "In Progress", value: "2", color: "text-amber-600" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="p-4 rounded-xl bg-[#F4F8FC] border border-[#DCE6F0]">
                      <p className={`text-2xl font-black ${color}`}>{value}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
                <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3">Account Actions</h3>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 border border-red-200 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out of AADHIRAI
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
