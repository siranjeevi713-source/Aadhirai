"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import api from "@/lib/api/client";
import { IntroAnimation } from "@/components/IntroAnimation";
import {
  AnalyticsOverview,
  PublicProof,
  PublicExploreItem,
  PublicTrackResponse,
} from "@/lib/types";
import {
  Camera,
  Cpu,
  Send,
  CheckCircle,
  Users,
  Building2,
  TrendingUp,
  ArrowRight,
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Loader2,
  AlertTriangle,
  QrCode,
} from "lucide-react";

// Dynamic Leaflet Map Component (avoid SSR)
const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 rounded-3xl bg-slate-100 flex items-center justify-center animate-pulse">
      <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
    </div>
  ),
});

export default function HomePage() {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  const [showIntro, setShowIntro] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const introPlayed = sessionStorage.getItem("aadhirai_intro_played");
      if (!user && introPlayed !== "true") {
        setShowIntro(true);
      }
    }
  }, [user]);

  const [stats, setStats] = useState<AnalyticsOverview | null>(null);
  const [proofs, setProofs] = useState<PublicProof[]>([]);
  const [recentIssues, setRecentIssues] = useState<PublicExploreItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Tracker state
  const [trackRef, setTrackRef] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackResult, setTrackResult] = useState<PublicTrackResponse | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<AnalyticsOverview>("/analytics/overview").catch(() => null),
      api.get<PublicProof[]>("/public/proofs?limit=3").catch(() => []),
      api.get<PublicExploreItem[]>("/complaints/public/explore?limit=6").catch(() => []),
    ])
      .then(([statsData, proofsData, issuesData]) => {
        if (statsData) setStats(statsData);
        setProofs(proofsData || []);
        setRecentIssues(issuesData || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleTrackSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackRef.trim()) return;
    setTrackError(null);
    setTrackingLoading(true);

    try {
      const res = await api.get<PublicTrackResponse>(
        `/complaints/track/${encodeURIComponent(trackRef.trim())}`
      );
      setTrackResult(res);
    } catch (err: any) {
      setTrackError(
        err.message || "Complaint reference not found. Please verify (e.g. ADH-2026-MSR-0001)."
      );
    } finally {
      setTrackingLoading(false);
    }
  };

  if (mounted && showIntro) {
    return (
      <IntroAnimation
        targetUrl="/login"
        durationMs={3000}
        onComplete={() => {
          setShowIntro(false);
          router.push("/login");
        }}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* ============================================================== */}
      {/* 1. HERO BANNER MATCHING REFERENCE IMAGE 2 (TOP LEFT)           */}
      {/* ============================================================== */}
      <section id="about" className="relative overflow-hidden bg-[#082D50] text-white">
        {/* Background Image: Tamil Nadu Temple Town & River */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url('/images/login-hero-bg.jpg'), url('/images/landing-hero.jpg'), url('https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=1200&auto=format&fit=crop&q=80')",
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-200 text-xs font-semibold backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse" />
                <span>AI-Powered Civic Accountability</span>
              </div>

              {/* Headline matching Reference 2 */}
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                A Cleaner,
                <br />
                Safer, Better
                <br />
                <span className="text-[#13C6B5]">Nammaoor.</span>
              </h1>

              {/* Subtitle matching Reference 2 */}
              <p className="text-sm sm:text-base text-slate-200 max-w-xl font-medium leading-relaxed">
                Report civic problems with a photo.
                <br />
                Let AI identify, route and ensure resolution.
              </p>

              {/* Action Buttons matching Reference 2 */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/citizen/submit"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#075CE5] hover:bg-[#064ec7] text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <span>Report a Problem</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/#how-it-works"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold backdrop-blur-md transition-all cursor-pointer"
                >
                  <span>Learn More</span>
                </Link>
              </div>
            </div>

            {/* Right: 4 Feature Cards in 2x2 Grid matching Reference 2 */}
            <div className="relative z-20 lg:col-span-5 grid grid-cols-2 gap-4">
              {/* Card 1: Upload Photo */}
              <Link
                href="/citizen/submit"
                className="p-5 rounded-2xl bg-white text-slate-900 shadow-xl flex flex-col justify-center space-y-2 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group select-none"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#075CE5] group-hover:scale-110 flex items-center justify-center transition-transform pointer-events-none">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#075CE5] transition-colors">Upload Photo</h3>
                <p className="text-[11px] text-slate-500">Capture or drop road & civic issues with GPS</p>
              </Link>

              {/* Card 2: AI identifies Issue */}
              <Link
                href="/citizen/submit"
                className="p-5 rounded-2xl bg-white text-slate-900 shadow-xl flex flex-col justify-center space-y-2 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group select-none"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8B5CF6] group-hover:scale-110 flex items-center justify-center transition-transform pointer-events-none">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#8B5CF6] transition-colors">AI identifies Issue</h3>
                <p className="text-[11px] text-slate-500">Instant computer vision classification & SLA scoring</p>
              </Link>

              {/* Card 3: Auto Routing */}
              <Link
                href="/#how-it-works"
                className="p-5 rounded-2xl bg-white text-slate-900 shadow-xl flex flex-col justify-center space-y-2 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group select-none"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] group-hover:scale-110 flex items-center justify-center transition-transform pointer-events-none">
                  <Send className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#10B981] transition-colors">Auto Routing</h3>
                <p className="text-[11px] text-slate-500">Directly assigns to ward officer & municipal wing</p>
              </Link>

              {/* Card 4: Tracked to Resolution */}
              <Link
                href="/explore"
                className="p-5 rounded-2xl bg-white text-slate-900 shadow-xl flex flex-col justify-center space-y-2 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group select-none"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#F59E0B] group-hover:scale-110 flex items-center justify-center transition-transform pointer-events-none">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#F59E0B] transition-colors">Tracked to Resolution</h3>
                <p className="text-[11px] text-slate-500">Public proof & before/after digital verification</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Statistics Bar matching Reference 2 */}
        <div className="border-t border-white/10 bg-[#062038]/90 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
              {/* Stat 1 */}
              <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-300">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">2,418</div>
                  <div className="text-xs text-slate-300">Complaints Resolved</div>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-300">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">12</div>
                  <div className="text-xs text-slate-300">Departments</div>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">98%</div>
                  <div className="text-xs text-slate-300">Resolution Rate</div>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-300">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">1,52,340</div>
                  <div className="text-xs text-slate-300">Citizens Participating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. PUBLIC TRACKER & CIVIC CATEGORIES                           */}
      {/* ============================================================== */}
      <section id="how-it-works" className="py-12 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Quick Complaint Tracker */}
            <div className="lg:col-span-6 bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#075CE5] flex items-center justify-center font-bold">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Track Complaint Status
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter your reference number (e.g. ADH-2026-MSR-0001)
                  </p>
                </div>
              </div>

              <form onSubmit={handleTrackSearch} className="flex gap-2">
                <input
                  type="text"
                  value={trackRef}
                  onChange={(e) => setTrackRef(e.target.value)}
                  placeholder="ADH-2026-MSR-0001"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#075CE5]"
                />
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#075CE5] hover:bg-[#064ec7] text-white text-xs font-bold transition-all cursor-pointer"
                >
                  {trackingLoading ? "Searching..." : "Track"}
                </button>
              </form>

              {trackError && (
                <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                  {trackError}
                </p>
              )}

              {trackResult && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{trackResult.reference_number}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold uppercase text-[10px]">
                      {trackResult.status}
                    </span>
                  </div>
                  <p className="text-slate-600">{trackResult.category}</p>
                  <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                    <span>Ward {trackResult.ward?.number} ({trackResult.ward?.name_en})</span>
                    <Link
                      href={`/proof/${trackResult.reference_number}`}
                      className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                    >
                      View Proof <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Problem Categories Gallery */}
            <div className="lg:col-span-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Common Civic Problems Detected by AADHIRAI
              </h3>
              <div className="grid grid-cols-5 gap-2 text-center">
                <Link
                  href="/citizen/submit"
                  className="p-3 bg-slate-50 hover:bg-blue-50/50 hover:border-[#075CE5] transition-all rounded-2xl border border-slate-200 flex flex-col items-center cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-100 group-hover:scale-105 transition-transform text-orange-600 flex items-center justify-center mb-1 text-sm font-bold">
                    🕳️
                  </div>
                  <span className="text-[11px] font-bold text-slate-800">Pothole</span>
                </Link>

                <Link
                  href="/citizen/submit"
                  className="p-3 bg-slate-50 hover:bg-blue-50/50 hover:border-[#075CE5] transition-all rounded-2xl border border-slate-200 flex flex-col items-center cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 group-hover:scale-105 transition-transform text-amber-600 flex items-center justify-center mb-1 text-sm font-bold">
                    🗑️
                  </div>
                  <span className="text-[11px] font-bold text-slate-800">Garbage</span>
                </Link>

                <Link
                  href="/citizen/submit"
                  className="p-3 bg-slate-50 hover:bg-blue-50/50 hover:border-[#075CE5] transition-all rounded-2xl border border-slate-200 flex flex-col items-center cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 group-hover:scale-105 transition-transform text-blue-600 flex items-center justify-center mb-1 text-sm font-bold">
                    💧
                  </div>
                  <span className="text-[11px] font-bold text-slate-800">Water Leak</span>
                </Link>

                <Link
                  href="/citizen/submit"
                  className="p-3 bg-slate-50 hover:bg-blue-50/50 hover:border-[#075CE5] transition-all rounded-2xl border border-slate-200 flex flex-col items-center cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-yellow-100 group-hover:scale-105 transition-transform text-yellow-600 flex items-center justify-center mb-1 text-sm font-bold">
                    💡
                  </div>
                  <span className="text-[11px] font-bold text-slate-800">Streetlight</span>
                </Link>

                <Link
                  href="/citizen/submit"
                  className="p-3 bg-slate-50 hover:bg-blue-50/50 hover:border-[#075CE5] transition-all rounded-2xl border border-slate-200 flex flex-col items-center cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-100 group-hover:scale-105 transition-transform text-teal-600 flex items-center justify-center mb-1 text-sm font-bold">
                    🌊
                  </div>
                  <span className="text-[11px] font-bold text-slate-800">Drainage</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. PROOF OF RESOLUTION SHOWCASE (REFERENCE IMAGE 2 BOTTOM)     */}
      {/* ============================================================== */}
      <section className="py-14 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#075CE5] uppercase tracking-wider">
              Transparency & Public Audit
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Verified Proof of Resolution
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Every complaint must provide geotagged before and after photographs verified by AI and municipal reviewers.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Proof of Resolution
                  </h3>
                  <p className="text-xs font-mono text-slate-500">#ADH-2026-MSR-0001</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Resolved on:</span>
                <span className="text-xs font-bold text-slate-800">18 Mar 2026</span>
              </div>
            </div>

            {/* Before / After Images matching Reference 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6">
              {/* Before Card */}
              <div className="space-y-2">
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-200 shadow-inner">
                  <img
                    src="/images/pothole-before.jpg"
                    alt="Before Resolution"
                    className="w-full h-full object-cover"
                    onError={(e: any) => {
                      e.target.src = "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=80";
                    }}
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 text-white text-[10px] font-bold backdrop-blur-sm">
                    Before
                  </div>
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  Reported Issue: Severe pothole on Main Road (Ward 5, Musiri)
                </div>
              </div>

              {/* After Card */}
              <div className="space-y-2">
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-200 shadow-inner">
                  <img
                    src="/images/proof-after.jpg"
                    alt="After Resolution"
                    className="w-full h-full object-cover"
                    onError={(e: any) => {
                      e.target.src = "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&auto=format&fit=crop&q=80";
                    }}
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold backdrop-blur-sm">
                    After
                  </div>
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  Repaired & Tar Sealed by Municipal Roads Department
                </div>
              </div>
            </div>

            {/* Verification Metadata & QR Code */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Verified by:</span>
                  <span className="font-bold text-slate-800">AI + Human Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-bold text-slate-800">Municipal Roads Department</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200">
                <QrCode className="w-8 h-8 text-slate-800" />
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900">Scan to View</div>
                  <div className="text-[10px] text-slate-500">Public Record</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. FOOTER                                                      */}
      {/* ============================================================== */}
      <footer id="contact" className="bg-[#082D50] text-white py-10 border-t border-slate-800 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="font-bold text-white text-sm">AADHIRAI – Nammaoor AI</div>
            <p className="text-slate-400">
              AI-Powered Civic Accountability Engine • Pilot Municipality: Musiri, Tamil Nadu
            </p>
          </div>
          <div className="text-slate-400 text-center sm:text-right">
            &ldquo;Complaints don&apos;t end at submit. They end at proof.&rdquo;
          </div>
        </div>
      </footer>
    </div>
  );
}
