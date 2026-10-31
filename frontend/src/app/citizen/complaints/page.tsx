"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import api from "@/lib/api/client";
import { Complaint } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Search,
  Filter,
  PlusCircle,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  FileText,
} from "lucide-react";

export default function CitizenComplaintsListPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Title & Submit CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            எனது புகார்கள் (My Grievances)
          </h1>
          <p className="text-xs text-slate-500">
            முசிறி நகராட்சியில் சமர்ப்பிக்கப்பட்ட உங்கள் புகார்களின் முழு வரலாறு
          </p>
        </div>

        <Link
          href="/citizen/submit"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{t.submitComplaint}</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="குறிப்பு எண் அல்லது தலைப்பைத் தேட..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {["ALL", "SUBMITTED", "IN_PROGRESS", "VERIFIED_RESOLVED", "DISPUTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
              }`}
            >
              {st === "ALL" ? "அனைத்தும்" : (t as any)[st] || st}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          புகார்கள் ஏற்றப்படுகின்றன...
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <FileText className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-white">
            பொருத்தமான புகார்கள் எதுவும் இல்லை
          </h3>
          <p className="text-xs text-slate-500">வடிகட்டிகளை மாற்றி மீண்டும் முயற்சிக்கவும்.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComplaints.map((c) => (
            <Link
              key={c.id}
              href={`/citizen/complaints/${c.id}`}
              className="group flex flex-col justify-between p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-lg transition-all dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    {c.public_reference}
                  </span>
                  <StatusBadge status={c.status} size="sm" />
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 line-clamp-2">
                  {c.title}
                </h3>

                <div className="space-y-1.5 mt-3 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">{c.ward_name || c.address_text || "முசிறி நகராட்சி"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>பதிவு: {new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  {c.due_at && (
                    <div className="flex items-center gap-1.5 text-indigo-600 font-semibold">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>காலக்கெடு: {new Date(c.due_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                <span>விவரங்கள் காண்க</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
