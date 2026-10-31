"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import api from "@/lib/api/client";
import { Complaint } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import ProtectedRoute from "@/components/ProtectedRoute";
import AadhiraiBrandLogo from "@/components/AadhiraiBrandLogo";
import {
  LayoutDashboard,
  Users,
  Building2,
  Map,
  FileText,
  BarChart2,
  Settings,
  LogOut,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Bell,
  ChevronRight,
} from "lucide-react";

const ADMIN_NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "User Management", icon: Users, href: "/admin/users" },
  { label: "Departments", icon: Building2, href: "/admin/departments" },
  { label: "Wards & Jurisdiction", icon: Map, href: "/admin/wards" },
  { label: "Complaint Management", icon: FileText, href: "/admin/complaints" },
  { label: "Analytics", icon: BarChart2, href: "/admin/analytics" },
  { label: "Verification", icon: FileCheck2, href: "/admin/verification", active: true },
  { label: "System Settings", icon: Settings, href: "/admin/settings" },
];

export default function AdminVerificationReviewPage() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [verificationData, setVerificationData] = useState<any>(null);

  const [action, setAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [justification, setJustification] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingReview();
  }, [user]);

  const fetchPendingReview = async () => {
    try {
      const data = await api.get<Complaint[]>("/complaints");
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
      await api.post(`/verification/${selectedComplaint.id}/review`, { action, justification });
      alert(`சரிபார்ப்பு முடிவு வெற்றிகரமாகப் பதிவு செய்யப்பட்டது: ${action}`);
      setJustification("");
      fetchPendingReview();
    } catch (err: any) {
      alert(err.message || "பிழை ஏற்பட்டது.");
    } finally {
      setSubmitting(false);
    }
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  return (
    <ProtectedRoute allowedRoles={["reviewer", "admin"]} portalTitle="சுயாதீன சரிபார்ப்பு முனையம் (Verification Workspace)">
      <div className="flex h-screen overflow-hidden bg-[#F4F8FC]">

        {/* ── Navy Left Sidebar ── */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#082D50] text-white">
          {/* Brand */}
          <div className="px-5 py-5 border-b border-white/10">
            <AadhiraiBrandLogo size="sm" variant="white" />
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {ADMIN_NAV.map(({ label, icon: Icon, href, active }) => {
              const isActive = active || pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#075CE5] text-white shadow-md"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                  {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />}
                </Link>
              );
            })}
          </nav>

          {/* User + Logout */}
          <div className="px-4 py-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-[#13C6B5] text-[#082D50] font-extrabold text-xs flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.full_name || "Admin"}</p>
                <p className="text-[10px] text-slate-400 truncate">Verification Reviewer</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-white/10 hover:text-white transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="bg-white border-b border-[#DCE6F0] px-6 py-3.5 flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-base font-bold text-[#082D50]">
                Independent Verification Workspace
              </h1>
              <p className="text-[11px] text-slate-500">
                Review officer-uploaded resolution photos • pHash fraud detection • Human override
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-xl border border-[#DCE6F0] hover:bg-[#F4F8FC]">
                <Bell className="h-4 w-4 text-slate-500" />
              </button>
              <div className="h-8 w-8 rounded-full bg-[#13C6B5] text-[#082D50] font-extrabold text-xs flex items-center justify-center">
                {initials}
              </div>
            </div>
          </header>

          {/* Workspace body */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-full">

              {/* ── Left Queue Panel ── */}
              <div className="bg-white rounded-2xl border border-[#DCE6F0] shadow-sm overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-[#DCE6F0] bg-[#F4F8FC]">
                  <h3 className="text-xs font-bold text-[#082D50] uppercase tracking-wider">
                    Review Queue ({complaints.length})
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Complaints pending verification decision
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {loading ? (
                    <div className="py-10 text-center text-xs text-slate-400">Loading queue...</div>
                  ) : complaints.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                      <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                      <p className="text-xs text-slate-500 font-semibold">Queue is empty</p>
                      <p className="text-[11px] text-slate-400">No complaints pending verification.</p>
                    </div>
                  ) : (
                    complaints.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectComplaint(c)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                          selectedComplaint?.id === c.id
                            ? "border-[#075CE5] bg-blue-50 shadow-sm"
                            : "border-[#DCE6F0] hover:bg-[#F4F8FC] hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[11px] font-bold text-[#075CE5]">
                            {c.public_reference}
                          </span>
                          <StatusBadge status={c.status} size="sm" />
                        </div>
                        <p className="text-xs font-semibold text-[#082D50] truncate">{c.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {c.ward_name || "Musiri Municipality"}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* ── Right Evidence + Review Panel ── */}
              <div className="lg:col-span-2 space-y-5">
                {selectedComplaint ? (
                  <>
                    {/* Header */}
                    <div className="bg-white rounded-2xl border border-[#DCE6F0] shadow-sm p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="inline-block font-mono text-[11px] font-bold text-[#075CE5] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                            {selectedComplaint.public_reference}
                          </span>
                          <h2 className="text-base font-bold text-[#082D50] mt-1.5">
                            {selectedComplaint.title}
                          </h2>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {selectedComplaint.ward_name || "Musiri Municipality"} • Ward {selectedComplaint.ward?.number || "—"}
                          </p>
                        </div>
                        <StatusBadge status={selectedComplaint.status} size="md" />
                      </div>
                    </div>

                    {/* AI pHash Verification Banner */}
                    {verificationData && (
                      <div className={`p-4 rounded-2xl border text-xs space-y-1 ${
                        verificationData.phash_match_detected
                          ? "bg-red-50 border-red-200 text-red-800"
                          : "bg-emerald-50 border-emerald-200 text-emerald-800"
                      }`}>
                        <div className="flex items-center gap-2 font-bold text-sm">
                          {verificationData.phash_match_detected ? (
                            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                          )}
                          <span>
                            {verificationData.phash_match_detected
                              ? "⚠ Fraud Alert: Duplicate image detected — same photo reused from earlier submission!"
                              : "✓ Digital Image Verification Passed — Resolution photo is unique"}
                          </span>
                        </div>
                        <p className="text-[11px] pl-7">
                          Audit note: {verificationData.audit_notes || "Automated pHash verification completed."}
                        </p>
                      </div>
                    )}

                    {/* Before / After Photos */}
                    <div className="bg-white rounded-2xl border border-[#DCE6F0] shadow-sm p-5 space-y-4">
                      <h3 className="text-xs font-bold text-[#082D50] uppercase tracking-wider">
                        Evidence Comparison
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                            Before — Citizen Submission
                          </span>
                          {verificationData?.before_evidence?.file_url ? (
                            <img
                              src={verificationData.before_evidence.file_url}
                              alt="Before"
                              className="w-full h-48 object-cover rounded-xl border border-[#DCE6F0]"
                            />
                          ) : (
                            <div className="h-48 bg-[#F4F8FC] rounded-xl border border-dashed border-[#DCE6F0] flex items-center justify-center text-xs text-slate-400">
                              No citizen photo available
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                            After — Officer Resolution Photo
                          </span>
                          {verificationData?.after_evidence?.file_url ? (
                            <img
                              src={verificationData.after_evidence.file_url}
                              alt="After"
                              className="w-full h-48 object-cover rounded-xl border border-[#DCE6F0]"
                            />
                          ) : (
                            <div className="h-48 bg-[#F4F8FC] rounded-xl border border-dashed border-[#DCE6F0] flex items-center justify-center text-xs text-slate-400">
                              Resolution photo not yet uploaded
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Override Form */}
                    <div className="bg-white rounded-2xl border border-[#DCE6F0] shadow-sm p-5">
                      <h3 className="text-xs font-bold text-[#082D50] uppercase tracking-wider mb-4">
                        Commissioner Human Override Decision
                      </h3>

                      <form onSubmit={handleReviewSubmit} className="space-y-4">
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="radio"
                              name="action"
                              value="APPROVE"
                              checked={action === "APPROVE"}
                              onChange={() => setAction("APPROVE")}
                              className="accent-emerald-600"
                            />
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                              action === "APPROVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "text-slate-600 border-[#DCE6F0]"
                            }`}>
                              ✓ Approve & Publish as Public Proof
                            </span>
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="radio"
                              name="action"
                              value="REJECT"
                              checked={action === "REJECT"}
                              onChange={() => setAction("REJECT")}
                              className="accent-rose-600"
                            />
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                              action === "REJECT"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "text-slate-600 border-[#DCE6F0]"
                            }`}>
                              ✕ Reject & Reopen Complaint
                            </span>
                          </label>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                            Audit Justification (Required) *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            placeholder="e.g. Site inspection confirmed — repair quality meets municipal standard. Road surface properly levelled."
                            className="w-full rounded-xl border border-[#DCE6F0] bg-[#F4F8FC] p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#075CE5] focus:outline-none focus:bg-white transition"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submitting}
                          className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all ${
                            action === "APPROVE"
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-red-600 hover:bg-red-700"
                          } ${submitting ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          {submitting
                            ? "Committing decision..."
                            : action === "APPROVE"
                            ? "Commit Approval & Generate Public Proof"
                            : "Commit Rejection & Reopen Case"}
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-2xl border border-[#DCE6F0] p-16 text-center">
                    <FileCheck2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-500">Select a complaint from the queue</p>
                    <p className="text-xs text-slate-400 mt-1">to review evidence and make a decision</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
