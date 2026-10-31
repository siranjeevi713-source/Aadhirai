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
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Trash2,
} from "lucide-react";

interface NotificationItem {
  id: string;
  title_en: string;
  title_ta: string;
  message_en: string;
  message_ta: string;
  time: string;
  type: "status" | "alert" | "info";
  read: boolean;
  reference?: string;
}

export default function CitizenNotificationsPage() {
  const { language } = useTranslation();
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif-1",
      title_en: "Complaint Assigned to Field Engineer",
      title_ta: "புகார் களப் பொறியாளருக்கு ஒதுக்கப்பட்டுள்ளது",
      message_en: "Your road repair complaint #ADH-2026-MSR-0001 has been assigned to Junior Engineer K. Murugan for site inspection.",
      message_ta: "உங்கள் சாலை பழுது புகார் #ADH-2026-MSR-0001 கள ஆய்விற்காக இளநிலை பொறியாளர் கே. முருகனுக்கு ஒதுக்கப்பட்டுள்ளது.",
      time: "10 mins ago",
      type: "status",
      read: false,
      reference: "ADH-2026-MSR-0001",
    },
    {
      id: "notif-2",
      title_en: "Musiri Ward 7 Drainage Maintenance Alert",
      title_ta: "முசிறி வார்டு 7 வடிகால் பராமரிப்பு எச்சரிக்கை",
      message_en: "Municipal sanitation team will be clearing primary stormwater drains along Perumal Kovil Street today.",
      message_ta: "நகராட்சி துப்புரவு குழு இன்று பெருமாள் கோவில் தெருவில் முக்கிய மழைநீர் வடிகால்களை தூர்வார உள்ளது.",
      time: "2 hours ago",
      type: "info",
      read: false,
    },
    {
      id: "notif-3",
      title_en: "Complaint Verification Underway",
      title_ta: "புகார் கள சரிபார்ப்பு நடைபெறுகிறது",
      message_en: "Independent administrative reviewer is currently inspecting work order photos for complaint #ADH-2026-MSR-0005.",
      message_ta: "புகார் #ADH-2026-MSR-0005-ன் பணி புகைப்படங்களை சுயாதீன சரிபார்ப்பாளர் ஆய்வு செய்து வருகிறார்.",
      time: "1 day ago",
      type: "alert",
      read: true,
      reference: "ADH-2026-MSR-0005",
    },
  ]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <ProtectedRoute allowedRoles={["citizen"]} portalTitle="Citizen Notifications">
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
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/10 text-white font-bold transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-teal-300" />
                  <span>Notifications</span>
                </div>
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Settings className="w-4 h-4" />
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
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">
                  {language === "ta" ? "அறிவிப்புகள்" : "Civic Notifications"}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Updates on your reported grievances and municipal field announcements.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={markAllRead}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-xs cursor-pointer"
                >
                  Mark All as Read
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="p-2 text-slate-400 hover:text-red-600 bg-white border border-slate-300 rounded-xl hover:bg-red-50 cursor-pointer"
                  title="Clear notifications"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-800">All caught up!</h3>
                  <p className="text-xs text-slate-500">You have no new notifications.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-5 rounded-2xl bg-white border transition-all ${
                      n.read ? "border-slate-200" : "border-blue-300 ring-2 ring-blue-50 bg-blue-50/20"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          n.type === "status"
                            ? "bg-blue-100 text-[#075CE5]"
                            : n.type === "alert"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-teal-100 text-teal-700"
                        }`}
                      >
                        {n.type === "status" ? (
                          <Clock className="w-5 h-5" />
                        ) : n.type === "alert" ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : (
                          <Info className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900">
                            {language === "ta" ? n.title_ta : n.title_en}
                          </h3>
                          <span className="text-[11px] text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {language === "ta" ? n.message_ta : n.message_en}
                        </p>
                        {n.reference && (
                          <div className="pt-2">
                            <Link
                              href={`/citizen/complaints`}
                              className="text-xs font-bold text-[#075CE5] hover:underline"
                            >
                              Track Progress (#{n.reference}) →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

