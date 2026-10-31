"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { User, Phone, Mail, Globe, Shield, LogOut } from "lucide-react";

export default function CitizenProfilePage() {
  const { t, language, setLanguage } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          பயனர் சுயவிவரம் (Citizen Profile)
        </h1>
        <p className="text-xs text-slate-500">
          உங்கள் கணக்கு விவரங்கள் மற்றும் மொழி அமைப்புகள்
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            {user ? user.full_name.charAt(0) : "C"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {user ? user.full_name : "குடிமகன் (Citizen)"}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span>சரிபார்க்கப்பட்ட பயனர் (Verified Citizen)</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> தொலைபேசி எண்
            </span>
            <p className="font-bold text-slate-900 dark:text-white">
              {user ? user.phone : "+91 98765 43210"}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> மின்னஞ்சல்
            </span>
            <p className="font-bold text-slate-900 dark:text-white">
              {user?.email || "மின்னஞ்சல் சேர்க்கப்படவில்லை"}
            </p>
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-indigo-600" />
            <span>விருப்ப மொழி (Preferred Language)</span>
          </label>
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <button
              onClick={() => setLanguage("ta")}
              className={`p-3 rounded-xl border text-xs font-bold transition-colors ${
                language === "ta"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              தமிழ் (Tamil - இயல்புநிலை)
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`p-3 rounded-xl border text-xs font-bold transition-colors ${
                language === "en"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={logout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>கணக்கிலிருந்து வெளியேறு (Logout)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
