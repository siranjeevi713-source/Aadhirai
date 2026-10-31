"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import api from "@/lib/api/client";
import { Category } from "@/lib/types";
import { ArrowLeft, PlusCircle, CheckCircle2, AlertCircle, Layers } from "lucide-react";

export default function AdminCategoriesPage() {
  const { t } = useTranslation();
  const { user, quickLoginAs } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // New Category Form
  const [code, setCode] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameTa, setNameTa] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = () => {
    api.get<Category[]>("/admin/categories")
      .then((data) => setCategories(data))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!user) await quickLoginAs("admin");
      await api.post("/admin/categories", {
        code,
        name_en: nameEn,
        name_ta: nameTa,
        default_priority: priority,
      });
      setCode("");
      setNameEn("");
      setNameTa("");
      fetchCategories();
      alert("புதிய துறை வகை வெற்றிகரமாக சேர்க்கப்பட்டது!");
    } catch (err: any) {
      alert(err.message || "சேர்ப்பதில் பிழை ஏற்பட்டது.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>கட்டளை மையத்திற்குத் திரும்பு (Back)</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            துறை வகைகள் மேலாண்மை (Category Management)
          </h1>
          <p className="text-xs text-slate-500">
            முசிறி நகராட்சியில் பெறப்படும் புகார்களின் வகைப்பாடு அட்டவணை
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Form */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-amber-600" />
            <span>புதிய வகை சேர்க்க</span>
          </h3>

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                குறியீடு (Code)
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="எ.கா: encroachment_issue"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-xs focus:border-amber-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                தமிழ் பெயர் (Tamil Name)
              </label>
              <input
                type="text"
                required
                value={nameTa}
                onChange={(e) => setNameTa(e.target.value)}
                placeholder="எ.கா: ஆக்கிரமிப்பு பிரச்சனை"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-xs focus:border-amber-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                ஆங்கில பெயர் (English Name)
              </label>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Encroachment Issue"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-xs focus:border-amber-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                முன்னுரிமை (Priority)
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-xs focus:border-amber-600 focus:outline-none"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
            >
              {submitting ? "சேர்க்கப்படுகிறது..." : "வகை சேர்க்க (Save)"}
            </button>
          </form>
        </div>

        {/* Existing Categories List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600" />
            <span>நடப்பு துறை வகைகள் ({categories.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex justify-between items-start text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{c.name_ta}</p>
                  <p className="text-[11px] text-slate-500">{c.name_en}</p>
                  <span className="font-mono text-[10px] text-indigo-600">{c.code}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                  {c.default_priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
