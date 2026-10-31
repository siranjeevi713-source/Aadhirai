"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import api from "@/lib/api/client";
import { Complaint } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import {
  HardHat,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Calendar,
  ArrowRight,
  Filter,
  Layers,
  FileText,
} from "lucide-react";

export default function OfficerDashboardPage() {
  const { t } = useTranslation();
  const { user, quickLoginAs, hasRole } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    // If not officer, auto switch or prompt
    fetchAssignments();
  }, [user]);

  const fetchAssignments = () => {
    api.get<Complaint[]>("/officer/assignments")
      .then((data) => {
        setComplaints(data);
        setFilteredComplaints(data);
      })
      .catch(() => {
        setComplaints([]);
        setFilteredComplaints([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (statusFilter === "ALL") {
      setFilteredComplaints(complaints);
    } else {
      setFilteredComplaints(complaints.filter((c) => c.status === statusFilter));
    }
  }, [statusFilter, complaints]);

  const assignedCount = complaints.filter((c) => c.status === "ASSIGNED").length;
  const inProgressCount = complaints.filter((c) => c.status === "IN_PROGRESS").length;
  const resolvedCount = complaints.filter((c) => c.status === "VERIFIED_RESOLVED").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Officer Header */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">
            <HardHat className="h-4 w-4 text-amber-400" />
            <span>அரசு அலுவலர் பணித்தளம் — முசிறி நகராட்சி</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {user?.full_name || "பொறியாளர் பாஸ்கரன் (Er. Baskaran)"}
          </h1>
          <p className="text-xs text-purple-200">
            {user?.officer_profile?.designation || "Assistant Engineer (Roads - Ward 7)"} • பேட்ஜ்:{" "}
            {user?.officer_profile?.badge_number || "MSR-AE-RD-07"}
          </p>
        </div>

        {!user && (
          <button
            onClick={() => quickLoginAs("officer")}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs shadow-md"
          >
            அலுவலராக உள்நுழைக
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t.assignedComplaints}</span>
            <Layers className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {loading ? "..." : complaints.length}
          </p>
          <span className="text-[10px] text-slate-400">மொத்த ஒதுக்கீடுகள்</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-semibold">ஏற்கப்பட வேண்டியவை</span>
            <Clock className="h-4 w-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">
            {loading ? "..." : assignedCount}
          </p>
          <span className="text-[10px] text-slate-400">ACTION REQUIRED</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-xs font-semibold">{t.activeRepairs}</span>
            <FileText className="h-4 w-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
            {loading ? "..." : inProgressCount}
          </p>
          <span className="text-[10px] text-slate-400">IN PROGRESS</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold">{t.verifiedResolutions}</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {loading ? "..." : resolvedCount}
          </p>
          <span className="text-[10px] text-slate-400">VERIFIED RESOLVED</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["ALL", "ASSIGNED", "IN_PROGRESS", "VERIFIED_RESOLVED"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              statusFilter === st
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
            }`}
          >
            {st === "ALL" ? "அனைத்து புகார்கள்" : (t as any)[st] || st}
          </button>
        ))}
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          ஒதுக்கப்பட்ட புகார்கள் ஏற்றப்படுகின்றன...
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-white">
            இந்தப் பிரிவில் நிலுவைப் பணிகள் ஏதுமில்லை
          </h3>
          <p className="text-xs text-slate-400">அனைத்துப் பணிகளும் குறித்த நேரத்தில் நடைபெறுகின்றன.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComplaints.map((c) => (
            <div
              key={c.id}
              className="flex flex-col justify-between p-5 rounded-2xl border border-slate-200 bg-white hover:border-purple-400 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300">
                    {c.public_reference}
                  </span>
                  <StatusBadge status={c.status} size="sm" />
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">
                  {c.title}
                </h3>

                <div className="space-y-1.5 mt-3 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">{c.ward_name || "வார்டு 7"}</span>
                  </div>
                  {c.due_at && (
                    <div className="flex items-center gap-1.5 text-indigo-600 font-bold">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>SLA காலக்கெடு: {new Date(c.due_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href={`/officer/complaints/${c.id}`}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white py-2 text-xs font-bold shadow-sm transition-colors"
                >
                  <span>பணி முனையத்தைத் திறக்க (Open Action Station)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
