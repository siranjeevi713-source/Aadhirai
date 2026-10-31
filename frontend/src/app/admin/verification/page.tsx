"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import api from "@/lib/api/client";
import { Complaint } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ArrowLeft,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Camera,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";

export default function AdminVerificationReviewPage() {
  const { t } = useTranslation();
  const { user, quickLoginAs } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [verificationData, setVerificationData] = useState<any>(null);

  // Review form
  const [action, setAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [justification, setJustification] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingReview();
  }, [user]);

  const fetchPendingReview = async () => {
    try {
      const data = await api.get<Complaint[]>("/complaints");
      // Filter for complaints in verification stages or flagged
      const toReview = data.filter((c) =>
        ["RESOLVED_PENDING_VERIFICATION", "NEEDS_REVIEW", "DISPUTED", "VERIFIED_RESOLVED"].includes(c.status)
      );
      setComplaints(toReview);
      if (toReview.length > 0 && !selectedComplaint) {
        handleSelectComplaint(toReview[0]);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const handleSelectComplaint = async (c: Complaint) => {
    setSelectedComplaint(c);
    try {
      const verif = await api.get<any>(`/verification/${c.id}`);
      setVerificationData(verif);
    } catch {
      setVerificationData(null);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSubmitting(true);
    try {
      if (!user) await quickLoginAs("admin");
      await api.post(`/verification/${selectedComplaint.id}/review`, {
        action,
        justification,
      });
      alert(`சரிபார்ப்பு முடிவு வெற்றிகரமாகப் பதிவு செய்யப்பட்டது: ${action}`);
      setJustification("");
      fetchPendingReview();
    } catch (err: any) {
      alert(err.message || "பிழை ஏற்பட்டது.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>கட்டளை மையத்திற்குத் திரும்பு (Back)</span>
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          சுயாதீன தீர்வு சரிபார்ப்பு முனையம் (Independent Verification Station)
        </h1>
        <p className="text-xs text-slate-500">
          அலுவலர் பதிவேற்றிய தீர்வுப் புகைப்படங்களின் டிஜிட்டல் பட மறுஆய்வு மற்றும் மனித மதிப்பீட்டு முறை
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Queue List */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            ஆய்வு வரிசை ({complaints.length})
          </h3>

          {loading ? (
            <p className="text-xs text-slate-400 py-6 text-center">ஏற்றப்படுகிறது...</p>
          ) : complaints.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">சரிபார்ப்பு நிலுவையில் எதுவுமில்லை.</p>
          ) : (
            <div className="space-y-2">
              {complaints.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectComplaint(c)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                    selectedComplaint?.id === c.id
                      ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-white">
                      {c.public_reference}
                    </span>
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {c.title}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Detailed Evidence Comparison & Review Form */}
        <div className="lg:col-span-2 space-y-6">
          {selectedComplaint ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">
                    {selectedComplaint.public_reference}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {selectedComplaint.title}
                  </h2>
                </div>
                <StatusBadge status={selectedComplaint.status} size="md" />
              </div>

              {/* Automated AI & pHash Verification Status Banner */}
              {verificationData && (
                <div className={`p-4 rounded-2xl text-xs space-y-1.5 border ${
                  verificationData.phash_match_detected
                    ? "bg-red-50 text-red-800 border-red-300"
                    : "bg-emerald-50 text-emerald-800 border-emerald-300"
                }`}>
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {verificationData.phash_match_detected ? (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    )}
                    <span>
                      {verificationData.phash_match_detected
                        ? "மோசடி எச்சரிக்கை: பழைய புகைப்படமே மீண்டும் பதிவேற்றப்பட்டுள்ளது! (Duplicate Image Detected)"
                        : "டிஜிட்டல் பட மறுஆய்வு தேர்ச்சி (Unique Resolution Image Verified)"}
                    </span>
                  </div>
                  <p className="text-[11px]">
                    தணிக்கைக் குறிப்பு: {verificationData.audit_notes || "சரிபார்ப்பு முடிவுகள் பெறப்பட்டன."}
                  </p>
                </div>
              )}

              {/* Side by Side Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    முந்தைய புகைப்படம் (குடிமகன்)
                  </span>
                  {verificationData?.before_evidence?.file_url ? (
                    <img
                      src={verificationData.before_evidence.file_url}
                      alt="Before"
                      className="w-full h-48 object-cover rounded-2xl border"
                    />
                  ) : (
                    <div className="h-48 bg-slate-100 rounded-2xl flex items-center justify-center text-xs text-slate-400">
                      ஆதாரம் இல்லை
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    பிந்தைய புகைப்படம் (அலுவலர்)
                  </span>
                  {verificationData?.after_evidence?.file_url ? (
                    <img
                      src={verificationData.after_evidence.file_url}
                      alt="After"
                      className="w-full h-48 object-cover rounded-2xl border"
                    />
                  ) : (
                    <div className="h-48 bg-slate-100 rounded-2xl flex items-center justify-center text-xs text-slate-400">
                      தீர்வுப் புகைப்படம் பதிவேற்றப்படவில்லை
                    </div>
                  )}
                </div>
              </div>

              {/* Review Override Controls */}
              <form onSubmit={handleReviewSubmit} className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  ஆணையர் இறுதி தீர்ப்பு (Commissioner Human Override)
                </h4>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-emerald-700 cursor-pointer">
                    <input
                      type="radio"
                      name="action"
                      value="APPROVE"
                      checked={action === "APPROVE"}
                      onChange={() => setAction("APPROVE")}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>ஏற்று பொதுச் சான்றாக வெளியிடு (Approve & Publish)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-rose-700 cursor-pointer">
                    <input
                      type="radio"
                      name="action"
                      value="REJECT"
                      checked={action === "REJECT"}
                      onChange={() => setAction("REJECT")}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>நிராகரித்து மீண்டும் பணிக்கு அனுப்பு (Reject & Reopen)</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    காரண விளக்கம் (Audit Justification) *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="எ.கா: தள ஆய்வு செய்யப்பட்டு தீர்வின் தரம் உறுதி செய்யப்பட்டது..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 text-xs focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-colors"
                >
                  {submitting ? "பதிவாகிறது..." : "முடிவை உறுதிசெய் (Commit Review Decision)"}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center text-xs text-slate-400">
              புகார் ஒன்றைத் தேர்ந்தெடுக்கவும்.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
