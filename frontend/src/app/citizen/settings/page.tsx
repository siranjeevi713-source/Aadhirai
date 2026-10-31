"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
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
  Globe,
  Shield,
  Smartphone,
  Check,
} from "lucide-react";

export default function CitizenSettingsPage() {
  const { language, setLanguage } = useTranslation();
  const { user, logout } = useAuth();

  const [smsAlerts, setSmsAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <ProtectedRoute allowedRoles={["citizen"]} portalTitle="Citizen Settings">
      <div className="flex h-screen overflow-hidden bg-[#F4F8FC] font-sans">
        {/* Navy Left Sidebar */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#082D50] text-white justify-between p-5 border-r border-[#062038]">
          <div className="space-y-6">
            <div className="px-2">
              <AadhiraiBrandLogo size="md" variant="white" />
            </div>

            <Link
              href="/citizen/submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#075CE5] hover:bg-[#064ec7] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report a Problem</span>
            </Link>

            <nav className="space-y-1 text-xs font-semibold">
              <Link
                href="/citizen"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/citizen/complaints"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>My Complaints</span>
              </Link>

              <Link
                href="/citizen/notifications"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </Link>

              <Link
                href="/citizen/profile"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Link>

              <Link
                href="/citizen/settings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 text-white font-bold transition-colors"
              >
                <Settings className="w-4 h-4 text-teal-300" />
                <span>Settings</span>
              </Link>
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-10">
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                {language === "ta" ? "அமைப்புகள்" : "Citizen Account Settings"}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Manage your application preferences, notifications, and municipal communication.
              </p>
            </div>

            {savedSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fade-up">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Settings preferences updated successfully!</span>
              </div>
            )}

            {/* Language Preference Card */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#075CE5] flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Preferred Language</h3>
                  <p className="text-xs text-slate-500">Choose your interface language</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLanguage("ta")}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                    language === "ta"
                      ? "border-[#075CE5] bg-blue-50/50 text-[#075CE5]"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  தமிழ் (Tamil)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                    language === "en"
                      ? "border-[#075CE5] bg-blue-50/50 text-[#075CE5]"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  English (United Kingdom)
                </button>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#13C6B5] flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Grievance Status Notifications</h3>
                  <p className="text-xs text-slate-500">Receive SMS / WhatsApp notifications when work starts or completes</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <span className="font-semibold text-slate-800">SMS Status Alerts</span>
                  <input
                    type="checkbox"
                    checked={smsAlerts}
                    onChange={(e) => setSmsAlerts(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#075CE5] focus:ring-[#075CE5]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <span className="font-semibold text-slate-800">WhatsApp Updates (Official TN Gov Gateway)</span>
                  <input
                    type="checkbox"
                    checked={whatsappAlerts}
                    onChange={(e) => setWhatsappAlerts(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#075CE5] focus:ring-[#075CE5]"
                  />
                </label>
              </div>
            </div>

            {/* Jurisdiction Details */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Shield className="w-4 h-4 text-[#075CE5]" />
                <span>Assigned Municipal Zone</span>
              </div>
              <p className="text-slate-600">
                You are registered in <strong>Musiri Municipality</strong>, Tiruchirappalli District, Tamil Nadu.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="w-full py-3 rounded-xl bg-[#075CE5] hover:bg-[#064ec7] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              Save Settings
            </button>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

