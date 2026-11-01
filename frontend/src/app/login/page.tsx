"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import api from "@/lib/api/client";
import { Department } from "@/lib/types";
import AadhiraiBrandLogo from "@/components/AadhiraiBrandLogo";
import {
  Camera,
  Cpu,
  Send,
  FileText,
  ShieldCheck,
  Building2,
  TrendingUp,
  Users,
  User,
  Briefcase,
  Shield,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Globe,
  AlertCircle,
  Loader2,
  UserPlus,
  Leaf,
  CheckCircle2,
} from "lucide-react";

type RoleOption = "citizen" | "officer" | "admin" | "reviewer";

export default function LoginPage() {
  const { language, setLanguage } = useTranslation();
  const { login } = useAuth();
  const router = useRouter();

  // Selected Role context
  const [selectedRole, setSelectedRole] = useState<RoleOption>("citizen");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("dept_roads");
  const [loadingDepts, setLoadingDepts] = useState<boolean>(false);

  // Form Fields - Citizens use mobile number, officers/admins use email
  const [identifier, setIdentifier] = useState("9876543210");
  const [password, setPassword] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch departments for officer role
  useEffect(() => {
    setLoadingDepts(true);
    api
      .get<Department[]>("/admin/departments")
      .then((data) => {
        if (data && data.length > 0) {
          setDepartments(data);
          setSelectedDeptId(data[0].id);
        }
      })
      .catch(() => {
        const fallbacks: Department[] = [
          { id: "dept_roads", code: "DEPT_ROADS", name_en: "Municipal Roads Department", name_ta: "சாலைகள் மற்றும் உள்கட்டமைப்பு" },
          { id: "dept_sanitation", code: "DEPT_SANITATION", name_en: "Sanitation & Waste Management", name_ta: "தூய்மை மற்றும் திடக்கழிவு" },
          { id: "dept_water", code: "DEPT_WATER_DRAINAGE", name_en: "Water Supply & Drainage", name_ta: "குடிநீர் விநியோகம் மற்றும் வடிகால்" },
          { id: "dept_electrical", code: "DEPT_ELECTRICAL", name_en: "Streetlight & Electrical", name_ta: "மின்சாரம் மற்றும் தெருவிளக்குகள்" },
          { id: "dept_health", code: "DEPT_HEALTH", name_en: "Public Health Department", name_ta: "பொது சுகாதாரத் துறை" },
        ];
        setDepartments(fallbacks);
        setSelectedDeptId(fallbacks[0].id);
      })
      .finally(() => setLoadingDepts(false));
  }, []);

  // Sync test credential defaults when user switches role tabs
  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role);
    setError(null);
    if (role === "citizen") {
      setIdentifier("citizen@aadhirai.gov.in");
      setPassword("Aadhirai@2026");
    } else if (role === "officer") {
      setIdentifier("deptadmin@aadhirai.gov.in");
      setPassword("Aadhirai@2026");
    } else if (role === "admin") {
      setIdentifier("superadmin@aadhirai.gov.in");
      setPassword("Aadhirai@2026");
    } else if (role === "reviewer") {
      setIdentifier("reviewer@aadhirai.gov.in");
      setPassword("Aadhirai@2026");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError(
        selectedRole === "citizen"
          ? (language === "ta"
              ? "கைப்பேசி எண் மற்றும் கடவுச்சொல்லை உள்ளிடவும்."
              : "Please enter your mobile number and password.")
          : (language === "ta"
              ? "மின்னஞ்சல் மற்றும் கடவுச்சொல்லை உள்ளிடவும்."
              : "Please enter your email and password.")
      );
      return;
    }

    if (selectedRole === "officer" && !selectedDeptId) {
      setError(
        language === "ta"
          ? "தயவுசெய்து உங்கள் நகராட்சித் துறையைத் தேர்ந்தெடுக்கவும்."
          : "Please select your municipal department."
      );
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        identifier: identifier.trim(),
        password,
        expected_role: selectedRole,
      };

      if (selectedRole === "officer" && selectedDeptId) {
        payload.expected_department_id = selectedDeptId;
      }

      const res = await api.post<{ access_token: string; user: any }>("/auth/login", payload);

      login(res.access_token, res.user);

      // Backend validated role routing
      const userRoles = (res.user.roles || []).map((r: any) => (r.name || r).toLowerCase());
      const userRole = (res.user.role || "").toLowerCase();

      if (userRoles.includes("admin") || userRoles.includes("super_admin") || userRole === "admin" || userRole === "super_admin") {
        router.push("/admin");
      } else if (userRoles.includes("reviewer") || userRole === "reviewer") {
        router.push("/admin/verification");
      } else if (userRoles.includes("officer") || userRoles.includes("department_admin") || userRole === "officer" || userRole === "department_admin") {
        router.push("/officer");
      } else {
        router.push("/citizen");
      }
    } catch (err: any) {
      setError(
        err.message ||
        (language === "ta"
          ? "உள்நுழைவு தோல்வியடைந்தது. தேர்வு செய்த பங்கு மற்றும் சான்றுகளைச் சரிபார்க்கவும்."
          : "Sign in failed. Please verify your selected role context and credentials.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EBF3FA] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans relative selection:bg-teal-500 selection:text-white">
      {/* Top Right Language Switcher Pill */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-30">
        <div className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-slate-200 text-xs font-semibold text-slate-700">
          <Globe className="h-3.5 w-3.5 text-slate-500" />
          <button
            type="button"
            onClick={() => setLanguage(language === "ta" ? "en" : "ta")}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            {language === "ta" ? "English" : "தமிழ்"}
          </button>
        </div>
      </div>

      {/* Main Container: Split-Screen Reference 1 Layout */}
      <div className="w-full max-w-7xl bg-white rounded-[28px] sm:rounded-[36px] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[720px] border border-slate-200/80">
        {/* ============================================================== */}
        {/* LEFT COLUMN: HERO CIVIC LANDSCAPE & 5 PROCESS ICONS (7 COLS) */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 relative p-8 sm:p-10 lg:p-12 flex flex-col justify-between overflow-hidden bg-[#082D50] text-white">
          {/* Background Image: Tamil Nadu Temple Town & Kaveri River */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('/images/login-hero-bg.jpg'), url('/images/landing-hero.jpg'), url('https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=1200&auto=format&fit=crop&q=80')",
            }}
          />

          {/* Deep Navy/Teal Gradient Overlay matching Reference 1 */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#082D50]/92 via-[#064A86]/85 to-[#082D50]/96 z-10" />

          {/* Top Brand Logo */}
          <div className="relative z-20">
            <AadhiraiBrandLogo size="lg" variant="white" />
          </div>

          {/* Hero Content & 5-Step Process */}
          <div className="relative z-20 my-auto py-6 space-y-6">
            {/* Pill: AI-Powered Civic Accountability */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-200 text-xs font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse" />
              <span>AI-Powered Civic Accountability</span>
            </div>

            {/* Headline matching Reference 1 */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              A Cleaner,
              <br />
              Safer, Better
              <br />
              <span className="text-[#13C6B5]">Nammaoor</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-200 max-w-lg font-medium leading-relaxed">
              Report civic problems with a photo.
              <br />
              Let AI identify, route and ensure resolution.
            </p>

            {/* 5 Process Circles matching Reference 1 */}
            <div className="pt-2 grid grid-cols-5 gap-2 sm:gap-3 max-w-xl text-center">
              {/* Step 1: Camera (Blue) */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-[#075CE5] shadow-lg flex items-center justify-center text-white ring-4 ring-white/15 hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-white leading-tight">
                  Report
                </span>
                <span className="text-[9px] text-slate-300 hidden sm:block leading-tight">
                  with Photo
                </span>
              </div>

              {/* Step 2: AI Detects (Purple) */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-[#8B5CF6] shadow-lg flex items-center justify-center text-white ring-4 ring-white/15 hover:scale-105 transition-transform">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-white leading-tight">
                  AI Detects
                </span>
                <span className="text-[9px] text-slate-300 hidden sm:block leading-tight">
                  the Issue
                </span>
              </div>

              {/* Step 3: Auto Routes (Green/Teal) */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-[#10B981] shadow-lg flex items-center justify-center text-white ring-4 ring-white/15 hover:scale-105 transition-transform">
                  <Send className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-white leading-tight">
                  Auto Routes
                </span>
                <span className="text-[9px] text-slate-300 hidden sm:block leading-tight">
                  to Department
                </span>
              </div>

              {/* Step 4: Track Progress (Orange) */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-[#F59E0B] shadow-lg flex items-center justify-center text-white ring-4 ring-white/15 hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-white leading-tight">
                  Track
                </span>
                <span className="text-[9px] text-slate-300 hidden sm:block leading-tight">
                  Progress
                </span>
              </div>

              {/* Step 5: Get Proof (Rose/Red) */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-[#EF4444] shadow-lg flex items-center justify-center text-white ring-4 ring-white/15 hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-white leading-tight">
                  Get Proof
                </span>
                <span className="text-[9px] text-slate-300 hidden sm:block leading-tight">
                  of Resolution
                </span>
              </div>
            </div>

            {/* Trust Statistics Container matching Reference 1 */}
            <div className="mt-4 rounded-2xl bg-[#062038]/90 border border-white/15 p-4 sm:p-5 backdrop-blur-md grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Stat 1 */}
              <div className="space-y-1">
                <Users className="w-5 h-5 text-teal-300" />
                <div className="text-xl sm:text-2xl font-black text-white">2,418</div>
                <div className="text-[10px] text-slate-300 font-medium">Complaints Resolved</div>
              </div>
              {/* Stat 2 */}
              <div className="space-y-1">
                <Building2 className="w-5 h-5 text-teal-300" />
                <div className="text-xl sm:text-2xl font-black text-white">12</div>
                <div className="text-[10px] text-slate-300 font-medium">Departments</div>
              </div>
              {/* Stat 3 */}
              <div className="space-y-1">
                <TrendingUp className="w-5 h-5 text-teal-300" />
                <div className="text-xl sm:text-2xl font-black text-white">98%</div>
                <div className="text-[10px] text-slate-300 font-medium">Resolution Rate</div>
              </div>
              {/* Stat 4 */}
              <div className="space-y-1">
                <Users className="w-5 h-5 text-teal-300" />
                <div className="text-xl sm:text-2xl font-black text-white">1,52,340</div>
                <div className="text-[10px] text-slate-300 font-medium">Citizens Participating</div>
              </div>
            </div>
          </div>

          {/* Bottom Left Sketch & Motto */}
          <div className="relative z-20 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Line Art Sketch representation */}
              <div className="flex flex-col">
                <span className="font-serif italic text-2xl text-teal-200 tracking-wide font-normal">
                  Musiri
                </span>
                <span className="text-[10px] text-slate-300 uppercase tracking-widest">
                  Tamil Nadu
                </span>
              </div>
              <div className="h-8 w-px bg-white/20 mx-2" />
              <div className="text-[11px] text-slate-200 font-medium flex items-center gap-1.5">
                <div className="flex flex-col leading-tight text-slate-300">
                  <span>Our Town</span>
                  <span>Our People</span>
                  <span className="text-teal-300 flex items-center gap-1">
                    Our Responsibility <Leaf className="w-3 h-3 text-emerald-400" />
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden sm:block text-[11px] text-slate-400">
              Piloted in Musiri Municipality
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: LOGIN CARD MATCHING REFERENCE 1 (5 COLS)        */}
        {/* ============================================================== */}
        <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
          <div>
            {/* Header: Logo, Subtitle, Motto */}
            <div className="flex flex-col items-center text-center space-y-1.5 pb-4">
              <AadhiraiBrandLogo size="lg" variant="dark" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-2">
                Civic Accountability Engine
              </h2>
              <p className="text-xs text-slate-500 italic">
                Complaints don&apos;t end at submit. They end at proof.
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="my-3 flex items-start gap-2.5 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200 animate-fade-up">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* 3 Role Selection Tabs matching Reference 1 */}
            <div className="my-4 grid grid-cols-3 gap-2">
              {/* Tab 1: Citizen */}
              <button
                type="button"
                onClick={() => handleRoleSelect("citizen")}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer ${selectedRole === "citizen"
                  ? "bg-[#075CE5] text-white shadow-md font-bold"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                  }`}
              >
                <User className={`h-4 w-4 mb-1 ${selectedRole === "citizen" ? "text-white" : "text-slate-500"}`} />
                <span className="text-xs leading-tight">Citizen</span>
                <span className={`text-[9px] ${selectedRole === "citizen" ? "text-blue-100" : "text-slate-400"}`}>
                  Report & Track
                </span>
              </button>

              {/* Tab 2: Officer */}
              <button
                type="button"
                onClick={() => handleRoleSelect("officer")}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer ${selectedRole === "officer"
                  ? "bg-[#075CE5] text-white shadow-md font-bold"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                  }`}
              >
                <Briefcase className={`h-4 w-4 mb-1 ${selectedRole === "officer" ? "text-white" : "text-slate-500"}`} />
                <span className="text-xs leading-tight">Officer</span>
                <span className={`text-[9px] ${selectedRole === "officer" ? "text-blue-100" : "text-slate-400"}`}>
                  Resolve Issues
                </span>
              </button>

              {/* Tab 3: Admin */}
              <button
                type="button"
                onClick={() => handleRoleSelect("admin")}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer ${selectedRole === "admin"
                  ? "bg-[#075CE5] text-white shadow-md font-bold"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                  }`}
              >
                <Shield className={`h-4 w-4 mb-1 ${selectedRole === "admin" ? "text-white" : "text-slate-500"}`} />
                <span className="text-xs leading-tight">Admin</span>
                <span className={`text-[9px] ${selectedRole === "admin" ? "text-blue-100" : "text-slate-400"}`}>
                  Manage System
                </span>
              </button>
            </div>

            {/* Reviewer secondary switch option if Admin or Reviewer */}
            {(selectedRole === "admin" || selectedRole === "reviewer") && (
              <div className="flex items-center justify-center gap-2 mb-3 text-[11px] text-slate-600">
                <span>Verification Role:</span>
                <button
                  type="button"
                  onClick={() => handleRoleSelect("admin")}
                  className={`px-2 py-0.5 rounded-md ${selectedRole === "admin" ? "bg-slate-900 text-white font-bold" : "text-slate-500 hover:underline"}`}
                >
                  Admin Portal
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => handleRoleSelect("reviewer")}
                  className={`px-2 py-0.5 rounded-md ${selectedRole === "reviewer" ? "bg-slate-900 text-white font-bold" : "text-slate-500 hover:underline"}`}
                >
                  Independent Reviewer
                </button>
              </div>
            )}

            {/* Department Selector for Officer Role */}
            {selectedRole === "officer" && (
              <div className="mb-4 p-3 bg-blue-50/70 rounded-xl border border-blue-100 animate-fade-up">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Select Your Assigned Department *
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-white rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {language === "ta" ? dept.name_ta : dept.name_en}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Form Title */}
            <div className="mt-2 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Login to Your Account
              </h3>
              <p className="text-xs text-slate-500">
                Access your dashboard to report, track and manage complaints.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {/* Identifier: Mobile Number for Citizen, Email for Officer/Admin */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {selectedRole === "citizen"
                    ? (language === "ta" ? "கைப்பேசி எண் (Mobile Number)" : "Mobile Number")
                    : (language === "ta" ? "மின்னஞ்சல் முகவரி (Email Address)" : "Email Address")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    {selectedRole === "citizen" ? (
                      <Phone className="h-4 w-4" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                  </div>
                  <input
                    type={selectedRole === "citizen" ? "tel" : "text"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      selectedRole === "citizen"
                        ? "Enter 10-digit mobile number (e.g. 9876543210)"
                        : "Enter your official email address"
                    }
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-white rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#075CE5] focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-white rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#075CE5] focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[#075CE5] focus:ring-[#075CE5]"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError("For password reset assistance, please contact Musiri Municipal Helpdesk at 1800-425-0101.");
                  }}
                  className="font-medium text-[#075CE5] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Blue Login Button matching Reference 1 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#075CE5] hover:bg-[#064ec7] text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Sign Up as Citizen Button matching Reference 1 */}
            <div className="mt-4 text-center space-y-2">
              <span className="text-[11px] text-slate-500 font-medium">
                Don&apos;t have an account?
              </span>
              <Link
                href="/register"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <UserPlus className="h-4 w-4 text-slate-600" />
                <span>Sign Up as Citizen</span>
              </Link>
            </div>

            {/* "or" divider */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="w-full border-t border-slate-200" />
              <span className="absolute bg-white px-2 text-[10px] uppercase font-bold text-slate-400">
                or
              </span>
            </div>

            {/* Continue with Google button */}
            <button
              type="button"
              onClick={() => {
                // Mock Google SSO for Citizen demonstration
                setIdentifier("9876543210");
                setPassword("Password123!");
                setSelectedRole("citizen");
              }}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Quick Demo Credentials Footer Pills for Evaluators */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 block mb-1">
              Quick Test Credentials:
            </span>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => handleRoleSelect("citizen")}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect("officer")}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Officer (Roads)
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect("admin")}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect("reviewer")}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Reviewer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
