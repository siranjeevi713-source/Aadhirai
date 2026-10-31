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
  MapPin,
  Calendar,
  Clock,
  HardHat,
  Building2,
  FileCheck2,
  AlertTriangle,
  Star,
  CheckCircle2,
  FileText,
  ShieldAlert,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function CitizenComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const complaintId = resolvedParams.id;

  const { t } = useTranslation();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Feedback State
  const [rating, setRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Dispute Modal
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeLoading, setDisputeLoading] = useState(false);

  useEffect(() => {
    fetchComplaint();
  }, [complaintId]);

  const fetchComplaint = async () => {
    try {
      const data = await api.get<Complaint>(`/complaints/${complaintId}`);
      setComplaint(data);
      const hist = await api.get<any[]>(`/complaints/${complaintId}/history`);
      setHistory(hist);
    } catch {
      // Error fetching
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/complaints/${complaintId}/feedback`, {
        rating,
        comments: feedbackComments,
      });
      setFeedbackSubmitted(true);
      fetchComplaint();
    } catch (err: any) {
      alert(err.message || "மதிப்பீடு சமர்ப்பித்தல் தோல்வியடைந்தது.");
    }
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisputeLoading(true);
    try {
      await api.post(`/complaints/${complaintId}/dispute`, {
        reason: disputeReason,
      });
      setDisputeOpen(false);
      fetchComplaint();
      alert("தீர்வு மறுக்கப்பட்டது. புகார் மறுஆய்வுக்கு அனுப்பப்பட்டது.");
    } catch (err: any) {
      alert(err.message || "பிழை ஏற்பட்டது.");
    } finally {
      setDisputeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-xs text-slate-400">
        புகார் விவரங்கள் ஏற்றப்படுகின்றன...
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900">புகார் காணப்படவில்லை</h2>
        <Link href="/citizen" className="text-xs font-bold text-indigo-600">
          குடிமக்கள் தளத்திற்குத் திரும்பு
        </Link>
      </div>
    );
  }

  const initialEvidence = complaint.evidence?.find((e) => e.phase === "INITIAL_SUBMISSION");
  const resolutionEvidence = complaint.evidence?.find((e) => e.phase === "RESOLUTION_PROOF");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Back Button */}
      <Link
        href="/citizen"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>தளத்திற்குத் திரும்பு (Back)</span>
      </Link>

      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="font-mono text-sm font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
              {complaint.public_reference}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-1">
              {complaint.title}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={complaint.status} size="lg" />
            {complaint.status === "VERIFIED_RESOLVED" && (
              <Link
                href={`/proof/${complaint.public_reference}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 hover:bg-emerald-100"
              >
                <FileCheck2 className="h-4 w-4" />
                <span>பொதுச் சான்று காண்க</span>
              </Link>
            )}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
          {complaint.description}
        </p>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px]">வார்டு & இருப்பிடம்:</span>
            <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-indigo-600" />
              {complaint.ward?.name_ta || "முசிறி வார்டு"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px]">ஒதுக்கப்பட்ட துறை:</span>
            <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
              {complaint.assigned_department?.name_ta || "ஒதுக்கீட்டில் உள்ளது"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px]">பொறுப்பு அலுவலர்:</span>
            <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
              <HardHat className="h-3.5 w-3.5 text-purple-600" />
              {complaint.assigned_officer_name || "ஒதுக்கீட்டில் உள்ளது"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px]">SLA காலக்கெடு:</span>
            <p className="font-bold text-indigo-600 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {complaint.due_at ? new Date(complaint.due_at).toLocaleDateString() : "48h"}
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Photographic Evidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Before Photo */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              முந்தைய புகைப்படம் (புகார் ஆதாரம்)
            </h3>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
              INITIAL SUBMISSION
            </span>
          </div>

          {initialEvidence ? (
            <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-inner bg-slate-100">
              <img
                src={initialEvidence.file_url}
                alt="Initial Evidence"
                className="w-full h-56 object-cover"
              />
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-500 font-mono">
                pHash: {initialEvidence.perceptual_hash || "Calculated"}
              </div>
            </div>
          ) : (
            <div className="h-48 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400">
              புகைப்படம் பதிவேற்றப்படவில்லை
            </div>
          )}
        </div>

        {/* After Photo */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              பிந்தைய புகைப்படம் (தீர்வு சான்று)
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
              RESOLUTION PROOF
            </span>
          </div>

          {resolutionEvidence ? (
            <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-inner bg-slate-100">
              <img
                src={resolutionEvidence.file_url}
                alt="Resolution Evidence"
                className="w-full h-56 object-cover"
              />
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 text-[11px] text-emerald-600 font-mono flex justify-between">
                <span>pHash: {resolutionEvidence.perceptual_hash}</span>
                <span className="font-bold">பாஸ்: தனித்துவமான சான்று</span>
              </div>
            </div>
          ) : (
            <div className="h-48 rounded-2xl bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center text-xs text-slate-400 space-y-1">
              <Clock className="h-6 w-6 text-slate-300" />
              <span>களப்பணி முடிந்த பின் தீர்வுப் புகைப்படம் இங்கு காட்சிப்படுத்தப்படும்</span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Tracking */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          புகார் கண்காணிப்பு காலவரிசை (Accountability Timeline)
        </h3>
        
        <div className="space-y-4">
          {history.map((h, i) => (
            <div key={h.id || i} className="flex items-start gap-3">
              <div className="mt-1 h-3 w-3 rounded-full bg-indigo-600 ring-4 ring-indigo-50 dark:ring-indigo-950 shrink-0" />
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-slate-900 dark:text-white">{h.action}</span>
                <p className="text-slate-500">{h.details}</p>
                <span className="text-[10px] text-slate-400">{new Date(h.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Citizen Feedback & Dispute Controls (Only if resolved) */}
      {complaint.status === "VERIFIED_RESOLVED" && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-3xl p-6 sm:p-8 border border-emerald-200 dark:border-emerald-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                தீர்வு திருப்திகரமாக உள்ளதா? (Resolution Feedback)
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                உங்கள் கருத்து அலுவலர்களின் மதிப்பீட்டிற்கு உதவும். பணி சரியாக நடைபெறவில்லை என்றால் நீங்கள் மேல்முறையீடு செய்யலாம்.
              </p>
            </div>
            <button
              onClick={() => setDisputeOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors shrink-0"
            >
              தீர்வை மறுத்து மேல்முறையீடு செய் (Dispute)
            </button>
          </div>

          {!feedbackSubmitted && !complaint.feedback ? (
            <form onSubmit={handleFeedbackSubmit} className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 dark:text-slate-600"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 pl-2">
                  {rating} / 5 நட்சத்திரங்கள்
                </span>
              </div>

              <textarea
                rows={2}
                value={feedbackComments}
                onChange={(e) => setFeedbackComments(e.target.value)}
                placeholder="உங்கள் கருத்துக்களை இங்கே பதிவிடவும்..."
                className="w-full rounded-xl border border-emerald-200 bg-white dark:bg-slate-800 p-2.5 text-xs focus:outline-none focus:border-emerald-600"
              />

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                மதிப்பீட்டைச் சமர்ப்பி
              </button>
            </form>
          ) : (
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-xs text-emerald-700 font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>நன்றி! உங்கள் திருப்தி மதிப்பீடு வெற்றிகரமாகப் பதிவு செய்யப்பட்டது.</span>
            </div>
          )}
        </div>
      )}

      {/* Dispute Modal */}
      {disputeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 border border-rose-200 dark:border-rose-900 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="h-7 w-7" />
              <h3 className="text-lg font-bold">தீர்வு மேல்முறையீடு (Dispute Resolution)</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              களப்பணி சரியாக நிறைவடையவில்லை அல்லது தவறாகத் தீர்க்கப்பட்டதாகக் குறிக்கப்பட்டிருந்தால் காரணத்தைக் குறிப்பிடவும். இது உடனடியாக ஆணையருக்கு அனுப்பப்படும்.
            </p>

            <form onSubmit={handleDisputeSubmit} className="space-y-4">
              <textarea
                required
                rows={4}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="எ.கா: குழி முழுமையாக மூடப்படவில்லை, மீண்டும் ஜல்லி கற்கள் பெயர்ந்துள்ளது..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs focus:border-rose-600 focus:outline-none"
              />

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setDisputeOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  ரத்து செய்
                </button>
                <button
                  type="submit"
                  disabled={disputeLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  {disputeLoading ? "அனுப்பப்படுகிறது..." : "மேல்முறையீடு உறுதிசெய்"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
