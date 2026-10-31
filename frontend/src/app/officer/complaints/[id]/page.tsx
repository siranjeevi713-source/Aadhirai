"use client";

import React, { useEffect, useState, use } from "react";
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
  ClipboardList,
  Wrench,
  Upload,
  BarChart2,
  MessageSquare,
  User,
  LogOut,
  ChevronRight,
  Camera,
  Layers,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Bell,
  MapPin,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

const OFFICER_NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/officer" },
  { label: "Assigned Complaints", icon: ClipboardList, href: "/officer/complaints", active: true },
  { label: "Work Updates", icon: Wrench, href: "/officer/work-updates" },
  { label: "Evidence Upload", icon: Upload, href: "/officer/evidence" },
  { label: "Analytics", icon: BarChart2, href: "/officer/analytics" },
  { label: "Messages", icon: MessageSquare, href: "/officer/messages" },
  { label: "Profile", icon: User, href: "/officer/profile" },
];

export default function OfficerComplaintActionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const complaintId = resolvedParams.id;
  const pathname = usePathname();

  const { user, logout } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  const [woTitle, setWoTitle] = useState("");
  const [woPlan, setWoPlan] = useState("");
  const [woCost, setWoCost] = useState("4500");
  const [woSubmitting, setWoSubmitting] = useState(false);

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
        setWoTitle(`Work Order: ${data.title}`);
        setWoPlan("Deploy field crew to inspect and remediate the issue completely.");
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      await api.post(`/officer/complaints/${complaintId}/accept`);
      fetchComplaint();
      alert("Assignment accepted! Status updated to IN_PROGRESS.");
    } catch (err: any) {
      alert(err.message || "Error accepting assignment.");
    }
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setWoSubmitting(true);
    try {
      await api.post(`/officer/complaints/${complaintId}/work-order`, {
        title: woTitle,
        action_plan: woPlan,
        estimated_cost: parseFloat(woCost) || 0,
      });
      fetchComplaint();
      alert("Work Order created successfully!");
    } catch (err: any) {
      alert(err.message || "Error creating work order.");
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
      alert("Please attach a resolution photo — it is mandatory.");
      return;
    }
    setResolveSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("resolution_file", resolutionFile);
      formData.append("officer_notes", officerNotes || "Work completed successfully.");
      formData.append("resolution_cost", resolutionCost);
      const res = await api.post<any>(`/officer/complaints/${complaintId}/resolve`, formData);
      setVerificationFeedback(res);
      fetchComplaint();
    } catch (err: any) {
      alert(err.message || "Failed to submit resolution.");
    } finally {
      setResolveSubmitting(false);
    }
  };

  const deptName = (user as any)?.department?.name_en || "Roads Department";
  const officerName = user?.full_name || "Ramesh Kumar";
  const initials = officerName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  const initialEvidence = complaint?.evidence?.find((e) => e.phase === "INITIAL_SUBMISSION");

  return (
    <ProtectedRoute allowedRoles={["officer", "admin"]} portalTitle="Officer Action Station">
      <div className="flex h-screen overflow-hidden bg-[#F4F8FC]">

        {/* ── Navy Left Sidebar ── */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#082D50] text-white">
          <div className="px-5 py-5 border-b border-white/10">
            <AadhiraiBrandLogo size="sm" variant="white" />
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {OFFICER_NAV.map(({ label, icon: Icon, href, active }) => {
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

          <div className="px-4 py-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-[#13C6B5] text-[#082D50] font-extrabold text-xs flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{officerName}</p>
                <p className="text-[10px] text-slate-400 truncate">{deptName}</p>
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
            <div className="flex items-center gap-3">
              <Link
                href="/officer"
                className="text-[11px] font-bold text-slate-400 hover:text-[#075CE5] transition-colors flex items-center gap-1"
              >
                ← Officer Dashboard
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-[11px] font-bold text-[#082D50]">
                {complaint?.public_reference || "Complaint Action"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-xl border border-[#DCE6F0] hover:bg-[#F4F8FC]">
                <Bell className="h-4 w-4 text-slate-500" />
              </button>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#13C6B5] text-[#082D50] font-extrabold text-xs flex items-center justify-center">
                  {initials}
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-[#082D50]">{officerName}</p>
                  <p className="text-[10px] text-slate-400">{deptName}</p>
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable body */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Loading complaint details...
            </div>
          ) : !complaint ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <p className="text-sm font-bold text-slate-700">Complaint not found</p>
              <Link href="/officer" className="text-xs font-bold text-[#075CE5]">
                ← Back to Dashboard
              </Link>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* ── Complaint Header Card ── */}
              <div className="bg-white rounded-2xl border border-[#DCE6F0] shadow-sm p-5">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="inline-block font-mono text-[11px] font-bold text-[#075CE5] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                      {complaint.public_reference}
                    </span>
                    <h1 className="text-xl font-black text-[#082D50] mt-2">{complaint.title}</h1>
                  </div>
                  <StatusBadge status={complaint.status} size="lg" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed border-t border-[#F4F8FC] pt-3">
                  {complaint.description}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
                  <div className="p-3 rounded-xl bg-[#F4F8FC] border border-[#DCE6F0]">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Ward / Location
                    </span>
                    <p className="font-bold text-[#082D50] mt-0.5">{complaint.ward?.name_ta || "Ward 7"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F4F8FC] border border-[#DCE6F0]">
                    <span className="text-[10px] text-slate-400">Coordinates</span>
                    <p className="font-mono text-slate-700 mt-0.5 text-[11px]">{complaint.latitude?.toFixed(4)}, {complaint.longitude?.toFixed(4)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F4F8FC] border border-[#DCE6F0]">
                    <span className="text-[10px] text-slate-400">Department</span>
                    <p className="font-bold text-[#082D50] mt-0.5">{complaint.assigned_department?.name_en || "Roads Dept"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F4F8FC] border border-[#DCE6F0]">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> SLA Deadline
                    </span>
                    <p className="font-bold text-[#075CE5] mt-0.5">
                      {complaint.due_at ? new Date(complaint.due_at).toLocaleDateString() : "48 Hours"}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Citizen Evidence Photo ── */}
              <div className="bg-white rounded-2xl border border-[#DCE6F0] shadow-sm p-5">
                <h3 className="text-xs font-bold text-[#082D50] uppercase tracking-wider flex items-center gap-2 mb-3">
                  <Camera className="h-4 w-4 text-[#075CE5]" />
                  Citizen Evidence Photo
                </h3>
                {initialEvidence ? (
                  <div className="max-w-sm rounded-xl overflow-hidden border border-[#DCE6F0]">
                    <img src={initialEvidence.file_url} alt="Citizen Evidence" className="w-full h-52 object-cover" />
                    <div className="p-2 bg-[#F4F8FC] text-[10px] font-mono text-slate-500">
                      pHash: {initialEvidence.perceptual_hash}
                    </div>
                  </div>
                ) : (
                  <div className="h-40 bg-[#F4F8FC] rounded-xl border border-dashed border-[#DCE6F0] flex items-center justify-center text-xs text-slate-400">
                    No photo attached by citizen
                  </div>
                )}
              </div>

              {/* ── Step 1: Accept Assignment ── */}
              {complaint.status === "ASSIGNED" && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">Step 1 — Accept Assignment</h3>
                    <p className="text-xs text-amber-700 mt-1">
                      This complaint has been routed to your ward. Confirm acceptance to begin field work.
                    </p>
                  </div>
                  <button
                    onClick={handleAccept}
                    className="px-6 py-2.5 rounded-xl bg-[#075CE5] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all shrink-0"
                  >
                    Accept Assignment →
                  </button>
                </div>
              )}

              {/* ── Step 2: Work Order ── */}
              <div className="bg-white rounded-2xl border border-[#DCE6F0] shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-[#082D50] uppercase tracking-wider flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#075CE5]" />
                    Step 2 — Work Order Management
                  </h3>
                  {complaint.work_orders && complaint.work_orders.length > 0 && (
                    <span className="text-[11px] font-mono font-bold bg-blue-50 text-[#075CE5] px-2.5 py-1 rounded-lg border border-blue-100">
                      {complaint.work_orders[0].order_number}
                    </span>
                  )}
                </div>

                {complaint.work_orders && complaint.work_orders.length > 0 ? (
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs space-y-2">
                    <p className="font-bold text-[#082D50]">Order: {complaint.work_orders[0].title}</p>
                    <p className="text-slate-600">Plan: {complaint.work_orders[0].action_plan}</p>
                    <p className="font-bold text-[#075CE5]">
                      Estimated Cost: ₹ {complaint.work_orders[0].estimated_cost.toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleCreateWorkOrder} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Work Order Title</label>
                      <input
                        type="text"
                        required
                        value={woTitle}
                        onChange={(e) => setWoTitle(e.target.value)}
                        className="w-full rounded-xl border border-[#DCE6F0] bg-[#F4F8FC] p-2.5 text-xs text-slate-800 focus:border-[#075CE5] focus:outline-none focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Action Plan</label>
                      <textarea
                        required
                        rows={3}
                        value={woPlan}
                        onChange={(e) => setWoPlan(e.target.value)}
                        className="w-full rounded-xl border border-[#DCE6F0] bg-[#F4F8FC] p-2.5 text-xs text-slate-800 focus:border-[#075CE5] focus:outline-none focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Estimated Cost (₹)</label>
                      <input
                        type="number"
                        value={woCost}
                        onChange={(e) => setWoCost(e.target.value)}
                        className="w-full rounded-xl border border-[#DCE6F0] bg-[#F4F8FC] p-2.5 text-xs text-slate-800 focus:border-[#075CE5] focus:outline-none focus:bg-white transition"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={woSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-[#075CE5] hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-60"
                    >
                      {woSubmitting ? "Creating..." : "Create Work Order"}
                    </button>
                  </form>
                )}
              </div>

              {/* ── Step 3: Upload Resolution Proof ── */}
              <div className="bg-white rounded-2xl border border-[#DCE6F0] shadow-sm p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-[#082D50] uppercase tracking-wider flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-emerald-600" />
                    Step 3 — Upload Resolution Proof Photo
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    After completing field work, upload the after-repair photo. It will be verified by pHash (duplicate detection) and AI visual delta scoring before going to independent review.
                  </p>
                </div>

                {verificationFeedback && (
                  <div className={`p-4 rounded-xl text-xs space-y-1 border ${
                    verificationFeedback.verification_status === "PASSED"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}>
                    <p className="font-bold flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Verification Status: {verificationFeedback.verification_status}
                    </p>
                    <p>
                      Duplicate Image Alert: {verificationFeedback.phash_match_detected ? "⚠ Yes (Fraud Warning)" : "✓ No (Passed)"}
                    </p>
                    <p>
                      AI Visual Delta Score: {Math.round(verificationFeedback.ai_visual_delta_score * 100)}%
                    </p>
                  </div>
                )}

                <form onSubmit={handleResolveSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      After-Repair Photo *
                    </label>
                    <div className="mt-1 border-2 border-dashed border-[#DCE6F0] rounded-2xl bg-[#F4F8FC] flex justify-center px-6 pt-5 pb-6">
                      {previewUrl ? (
                        <div className="relative mx-auto max-w-[240px] rounded-xl overflow-hidden shadow-md">
                          <img src={previewUrl} alt="Preview" className="w-full h-auto object-cover max-h-48" />
                          <button
                            type="button"
                            onClick={() => { setResolutionFile(null); setPreviewUrl(null); }}
                            className="absolute top-2 right-2 bg-red-600 text-white rounded-full px-2 py-0.5 text-[10px] font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 text-center">
                          <Camera className="mx-auto h-8 w-8 text-slate-300" />
                          <label className="cursor-pointer font-bold text-xs text-[#075CE5] hover:underline">
                            <span>Select after-repair photo</span>
                            <input
                              type="file"
                              required
                              accept="image/*"
                              onChange={handleFileChange}
                              className="sr-only"
                            />
                          </label>
                          <p className="text-[11px] text-slate-400">JPG, PNG — max 10 MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Officer Completion Remarks
                    </label>
                    <textarea
                      rows={2}
                      value={officerNotes}
                      onChange={(e) => setOfficerNotes(e.target.value)}
                      placeholder="e.g. Pothole in Ward 7 fully patched and road surface levelled. Crew: 4 workers."
                      className="w-full rounded-xl border border-[#DCE6F0] bg-[#F4F8FC] p-2.5 text-xs text-slate-800 focus:border-[#075CE5] focus:outline-none focus:bg-white transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resolveSubmitting}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-60"
                  >
                    {resolveSubmitting
                      ? "Submitting for verification..."
                      : "Submit for Independent Verification →"}
                  </button>
                </form>
              </div>

            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
