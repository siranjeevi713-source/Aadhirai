"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import api from "@/lib/api/client";
import { Complaint } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ArrowLeft,
  HardHat,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileCheck2,
  Camera,
  Layers,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function OfficerComplaintActionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const complaintId = resolvedParams.id;

  const { t } = useTranslation();
  const { user, quickLoginAs } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  // Work Order Form
  const [woTitle, setWoTitle] = useState("");
  const [woPlan, setWoPlan] = useState("");
  const [woCost, setWoCost] = useState("4500");
  const [woSubmitting, setWoSubmitting] = useState(false);

  // Resolution Evidence Form
  const [resolutionFile, setResolutionFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [officerNotes, setOfficerNotes] = useState("");
  const [resolutionCost, setResolutionCost] = useState("4500");
  const [resolveSubmitting, setResolveSubmitting] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<any>(null);

  useEffect(() => {
    fetchComplaint();
  }, [complaintId]);

  const fetchComplaint = async () => {
    try {
      const data = await api.get<Complaint>(`/complaints/${complaintId}`);
      setComplaint(data);
      if (data.title) {
        setWoTitle(`பணி ஆணை: ${data.title}`);
        setWoPlan(`களப்பணி குழுவை அனுப்பி குறைபாட்டை முழுமையாகச் சரிசெய்தல்.`);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      if (!user) await quickLoginAs("officer");
      await api.post(`/officer/complaints/${complaintId}/accept`);
      fetchComplaint();
      alert("ஒப்படைப்பு ஏற்கப்பட்டது! நிலை: IN_PROGRESS");
    } catch (err: any) {
      alert(err.message || "பிழை ஏற்பட்டது.");
    }
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setWoSubmitting(true);
    try {
      if (!user) await quickLoginAs("officer");
      await api.post(`/officer/complaints/${complaintId}/work-order`, {
        title: woTitle,
        action_plan: woPlan,
        estimated_cost: parseFloat(woCost) || 0,
      });
      fetchComplaint();
      alert("வேலை உத்தரவு (Work Order) வெற்றிகரமாக உருவாக்கப்பட்டது!");
    } catch (err: any) {
      alert(err.message || "பிழை ஏற்பட்டது.");
    } finally {
      setWoSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResolutionFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionFile) {
      alert("தீர்வுக்கான புகைப்பட ஆதாரத்தை இணைப்பது கட்டாயம்!");
      return;
    }

    setResolveSubmitting(true);
    try {
      if (!user) await quickLoginAs("officer");
      const formData = new FormData();
      formData.append("resolution_file", resolutionFile);
      formData.append("officer_notes", officerNotes || "பணி வெற்றிகரமாக நிறைவு செய்யப்பட்டது.");
      formData.append("resolution_cost", resolutionCost);

      const res = await api.post<any>(`/officer/complaints/${complaintId}/resolve`, formData);
      setVerificationFeedback(res);
      fetchComplaint();
    } catch (err: any) {
      alert(err.message || "தீர்வு சமர்ப்பித்தல் தோல்வியடைந்தது.");
    } finally {
      setResolveSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-xs text-slate-400">
        பணி விவரங்கள் ஏற்றப்படுகின்றன...
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900">புகார் காணப்படவில்லை</h2>
        <Link href="/officer" className="text-xs font-bold text-purple-600">
          அலுவலர் தளத்திற்குத் திரும்பு
        </Link>
      </div>
    );
  }

  const initialEvidence = complaint.evidence?.find((e) => e.phase === "INITIAL_SUBMISSION");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Back */}
      <Link
        href="/officer"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-purple-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>அலுவலர் தளத்திற்குத் திரும்பு (Back)</span>
      </Link>

      {/* Grievance Header */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="font-mono text-sm font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-3 py-1 rounded-lg border border-purple-200 dark:border-purple-800">
              {complaint.public_reference}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-1">
              {complaint.title}
            </h1>
          </div>
          <StatusBadge status={complaint.status} size="lg" />
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
          {complaint.description}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
          <div>
            <span className="text-slate-400 text-[11px]">இடம் & வார்டு:</span>
            <p className="font-bold text-slate-800 dark:text-white">{complaint.ward?.name_ta || "வார்டு 7"}</p>
          </div>
          <div>
            <span className="text-slate-400 text-[11px]">அட்சரேகை, தீர்க்கரேகை:</span>
            <p className="font-mono text-slate-700 dark:text-slate-300">{complaint.latitude}, {complaint.longitude}</p>
          </div>
          <div>
            <span className="text-slate-400 text-[11px]">துறை:</span>
            <p className="font-bold text-slate-800 dark:text-white">{complaint.assigned_department?.name_ta || "சாலைத்துறை"}</p>
          </div>
          <div>
            <span className="text-slate-400 text-[11px]">SLA காலக்கெடு:</span>
            <p className="font-bold text-indigo-600">{complaint.due_at ? new Date(complaint.due_at).toLocaleDateString() : "48 மணி"}</p>
          </div>
        </div>
      </div>

      {/* Citizen Evidence Photo */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Camera className="h-4 w-4 text-purple-600" />
          <span>குடிமகன் சமர்ப்பித்த புகார் ஆதாரம் (Citizen Evidence)</span>
        </h3>
        {initialEvidence ? (
          <div className="max-w-md rounded-2xl overflow-hidden border border-slate-200">
            <img src={initialEvidence.file_url} alt="Evidence" className="w-full h-56 object-cover" />
            <div className="p-2 bg-slate-50 text-[11px] font-mono text-slate-500">
              pHash: {initialEvidence.perceptual_hash}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">புகைப்படம் இணைக்கப்படவில்லை.</p>
        )}
      </div>

      {/* STEP 1: Accept Assignment */}
      {complaint.status === "ASSIGNED" && (
        <div className="bg-amber-50 dark:bg-amber-950/40 p-6 rounded-3xl border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              படி 1: பணியை ஏற்று பொறுப்பேற்கவும்
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              இந்த புகார் உங்கள் வார்டுக்கு ஒதுக்கப்பட்டுள்ளது. பணியைத் தொடங்க ஏற்பை உறுதிப்படுத்தவும்.
            </p>
          </div>
          <button
            onClick={handleAccept}
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-colors shrink-0"
          >
            பணியை ஏற்கிறேன் (Accept Assignment)
          </button>
        </div>
      )}

      {/* STEP 2: Work Order Management */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-600" />
            <span>படி 2: வேலை உத்தரவு (Work Order Management)</span>
          </h3>
          {complaint.work_orders && complaint.work_orders.length > 0 && (
            <span className="text-xs font-mono font-bold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg">
              {complaint.work_orders[0].order_number}
            </span>
          )}
        </div>

        {complaint.work_orders && complaint.work_orders.length > 0 ? (
          <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 text-xs space-y-2">
            <p className="font-bold text-purple-900 dark:text-purple-200">
              உத்தரவு: {complaint.work_orders[0].title}
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              திட்டம்: {complaint.work_orders[0].action_plan}
            </p>
            <p className="text-indigo-600 font-bold">
              மதிப்பீட்டுத் தொகை: ரூ. {complaint.work_orders[0].estimated_cost.toLocaleString()}
            </p>
          </div>
        ) : (
          <form onSubmit={handleCreateWorkOrder} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                வேலை உத்தரவு தலைப்பு
              </label>
              <input
                type="text"
                required
                value={woTitle}
                onChange={(e) => setWoTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 text-xs focus:border-purple-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                செயல் திட்டம் (Action Plan)
              </label>
              <textarea
                required
                rows={3}
                value={woPlan}
                onChange={(e) => setWoPlan(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 text-xs focus:border-purple-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                மதிப்பீட்டுத் தொகை (ரூ.)
              </label>
              <input
                type="number"
                value={woCost}
                onChange={(e) => setWoCost(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 text-xs focus:border-purple-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={woSubmitting}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
            >
              {woSubmitting ? "உருவாக்கப்படுகிறது..." : "வேலை உத்தரவை உறுதிசெய்"}
            </button>
          </form>
        )}
      </div>

      {/* STEP 3: Upload Resolution Proof */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-emerald-600" />
            <span>படி 3: தீர்வுக்கான ஆதாரப் புகைப்படத்தைப் பதிவேற்றவும் (Upload Resolution Proof)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            களப்பணி முடிந்த பின் புதிய புகைப்படத்தை பதிவேற்றவும். இது டிஜிட்டல் பட மறுபயன்பாட்டு சோதனை (pHash) மூலம் சுயாதீனமாக சரிபார்க்கப்படும்.
          </p>
        </div>

        {verificationFeedback && (
          <div className={`p-4 rounded-2xl text-xs space-y-1 border ${
            verificationFeedback.verification_status === "PASSED"
              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
              : "bg-amber-50 text-amber-800 border-amber-300"
          }`}>
            <p className="font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              சரிபார்ப்பு நிலை: {verificationFeedback.verification_status}
            </p>
            <p>
              டிஜிட்டல் பட மறுபயன்பாட்டு எச்சரிக்கை: {verificationFeedback.phash_match_detected ? "ஆம் (Fraud Alert)" : "இல்லை (Passed)"}
            </p>
            <p>
              AI காட்சி மாற்றம் (Visual Delta): {Math.round(verificationFeedback.ai_visual_delta_score * 100)}%
            </p>
          </div>
        )}

        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              தீர்வுப் புகைப்படம் (After-Repair Photo) *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-2xl bg-slate-50 dark:bg-slate-800/30">
              {previewUrl ? (
                <div className="relative mx-auto max-w-[240px] rounded-xl overflow-hidden shadow-md">
                  <img src={previewUrl} alt="Preview" className="w-full h-auto object-cover max-h-48" />
                  <button
                    type="button"
                    onClick={() => {
                      setResolutionFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 text-[10px]"
                  >
                    மாற்று
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-center">
                  <Camera className="mx-auto h-8 w-8 text-slate-400" />
                  <label className="cursor-pointer font-bold text-xs text-purple-600 hover:underline">
                    <span>பணி நிறைவு புகைப்படத்தைத் தேர்ந்தெடுக்கவும்</span>
                    <input
                      type="file"
                      required
                      accept="image/*"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              அலுவலர் நிறைவுக் குறிப்புகள் (Officer Remarks)
            </label>
            <textarea
              rows={2}
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              placeholder="எ.கா: வார்டு 7 பகுதியில் குழி முழுமையாக மூடப்பட்டு சாலை சமன் செய்யப்பட்டது..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 text-xs focus:border-purple-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={resolveSubmitting}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
          >
            {resolveSubmitting ? "சரிபார்க்கப்படுகிறது..." : "சுயாதீன சரிபார்ப்புக்கு சமர்ப்பி (Submit for Verification)"}
          </button>
        </form>
      </div>
    </div>
  );
}
