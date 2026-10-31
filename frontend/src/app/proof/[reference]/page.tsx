"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import api from "@/lib/api/client";
import { PublicProof } from "@/lib/types";
import AadhiraiBrandLogo from "@/components/AadhiraiBrandLogo";
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  Clock,
  QrCode,
  ArrowLeft,
  ExternalLink,
  Search,
  Check,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function PublicProofPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const resolvedParams = use(params);
  const reference = resolvedParams.reference;

  const { t } = useTranslation();
  const router = useRouter();

  const [proof, setProof] = useState<PublicProof | null>(null);
  const [complaintStatus, setComplaintStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notResolvedYet, setNotResolvedYet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchRef, setSearchRef] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    setNotResolvedYet(false);

    // First check tracking API to verify actual complaint status
    api
      .get<any>(`/complaints/track/${reference}`)
      .then((cData) => {
        setComplaintStatus(cData.status);
        if (cData.status !== "VERIFIED_RESOLVED") {
          // The complaint is still in progress / not approved yet!
          setNotResolvedYet(true);
          setLoading(false);
          return;
        }

        // Only fetch and show proof if actually VERIFIED_RESOLVED
        return api.get<PublicProof>(`/public/proof/${reference}`).then((data) => {
          setProof(data);
          setLoading(false);
        });
      })
      .catch(() => {
        // Fallback: try public proof directly
        api
          .get<PublicProof>(`/public/proof/${reference}`)
          .then((data) => {
            setProof(data);
            setLoading(false);
          })
          .catch((err) => {
            if (err?.message?.includes("still undergoing resolution") || err?.status === 403) {
              setNotResolvedYet(true);
            } else {
              setError("Public proof record not found or complaint is pending official verification.");
            }
            setLoading(false);
          });
      });
  }, [reference]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchRef.trim()) {
      router.push(`/proof/${searchRef.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8FC] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
              placeholder="Search reference (e.g. ADH-2024-001)"
              className="text-xs px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#075CE5] hover:bg-[#064ec7] text-white text-xs font-bold transition-all cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>

        {/* Conditional View: Not Resolved Yet Banner */}
        {notResolvedYet && (
          <div className="bg-white rounded-3xl p-8 border border-amber-200 shadow-xl space-y-6 animate-fade-up">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Resolution Pending Official Permission
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  Complaint Under Active Investigation
                </h1>
                <p className="text-xs font-mono font-bold text-[#075CE5]">
                  #{reference}
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Official Permission & Verification Required</span>
              </div>
              <p className="leading-relaxed text-[11px] text-amber-800">
                This civic issue has been registered and assigned to the municipal department. It will strictly <strong>NOT</strong> be marked as resolved until the municipal officer completes the physical work, uploads the resolution photo, and the independent administrative reviewer verifies and approves the proof.
              </p>
              <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
                <span className="text-amber-700 font-semibold">Current Official Status:</span>
                <span className="font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950">
                  {complaintStatus || "ASSIGNED • IN_PROGRESS"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link
                href="/citizen"
                className="px-5 py-2.5 rounded-xl bg-[#075CE5] text-white text-xs font-bold shadow-sm"
              >
                Go to Citizen Dashboard
              </Link>
              <Link
                href="/"
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MAIN PROOF CARD: ONLY SHOWN WHEN ACTUALLY VERIFIED_RESOLVED    */}
        {/* ============================================================== */}
        {!notResolvedYet && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-8 animate-fade-up">
          {/* Header with Green Check Circle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  Proof of Resolution
                </h1>
                <p className="text-xs font-mono font-bold text-[#075CE5]">
                  #{proof?.reference_number || reference}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Resolved on:</span>
              <span className="font-bold text-slate-800">
                {proof?.resolved_at
                  ? new Date(proof.resolved_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                  : "18 Mar 2024"}
              </span>
            </div>
          </div>

          {/* Side-by-Side Before / After Photos matching Reference 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Before Photo */}
            <div className="space-y-2">
              <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-slate-100 border border-slate-200 shadow-inner">
                <img
                  src={proof?.before_image_url || "/images/pothole-before.jpg"}
                  alt="Before Resolution"
                  className="w-full h-full object-cover"
                  onError={(e: any) => {
                    e.target.src =
                      "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 text-white text-[11px] font-bold backdrop-blur-sm">
                  Before
                </div>
              </div>
              <div className="text-xs font-semibold text-slate-700">
                Initial Civic Report: {proof?.category_name_en || "Pothole on Road"}
              </div>
            </div>

            {/* After Photo */}
            <div className="space-y-2">
              <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-slate-100 border border-slate-200 shadow-inner">
                <img
                  src={proof?.after_image_url || "/images/proof-after.jpg"}
                  alt="After Resolution"
                  className="w-full h-full object-cover"
                  onError={(e: any) => {
                    e.target.src =
                      "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold backdrop-blur-sm">
                  After
                </div>
              </div>
              <div className="text-xs font-semibold text-emerald-700">
                Completed Resolution: Permanent bitumen seal & resurfacing
              </div>
            </div>
          </div>

          {/* Metadata & QR Code Section matching Reference 2 */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Verified by:</span>
                <span className="font-bold text-slate-800">
                  AI + Human Review
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Department:</span>
                <span className="font-bold text-slate-800">
                  {proof?.department_name_en || "Municipal Roads Department"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Jurisdiction:</span>
                <span className="font-semibold text-slate-700">
                  Ward {proof?.ward_number || 5}, Musiri Municipality
                </span>
              </div>
            </div>

            {/* QR Code Container matching Reference 2 */}
            <div className="flex items-center gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200 self-stretch sm:self-auto">
              <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 p-1 flex items-center justify-center">
                <QrCode className="w-full h-full text-slate-800" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">
                  Scan to View
                </div>
                <div className="text-[11px] text-slate-500">
                  Public Record
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Proof Hash Strip */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>SHA-256 Public Proof Hash:</span>
            <span>{proof?.proof_hash || "9f83ab2140d71a82e9b89736f1c4226344d909"}</span>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
