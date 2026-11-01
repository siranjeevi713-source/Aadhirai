"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { ShieldAlert, ArrowLeft, Lock, Loader2, Home } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("citizen" | "officer" | "reviewer" | "admin")[];
  portalTitle?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  portalTitle = "அதிகாரப்பூர்வ தளம் (Official Portal)",
}: ProtectedRouteProps) {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-slate-700 dark:text-slate-200 animate-spin" />
        </div>
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          பாதுகாப்பு சான்றுகள் சரிபார்க்கப்படுகின்றன…
        </p>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!token || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-5">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              401 — அங்கீகாரம் தேவை (Authentication Required)
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              உள்நுழைவு தேவை
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              இந்த {portalTitle} பக்கத்தை அணுக உங்கள் பயனர் கணக்கில் உள்நுழையவும்.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>உள்நுழைவு பக்கத்திற்குச் செல் (Login)</span>
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <Home className="h-3.5 w-3.5" />
              <span>முகப்புப் பக்கம் (Home)</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Role Authorization Check
  const userRoleNames = user.roles.map((r) => r.name.toLowerCase());
  const isAdmin = userRoleNames.includes("admin") || userRoleNames.includes("super_admin");
  // Map aliases: department_admin → officer
  const effectiveRoles = new Set(userRoleNames);
  if (effectiveRoles.has("department_admin")) effectiveRoles.add("officer");
  if (effectiveRoles.has("super_admin")) effectiveRoles.add("admin");

  const isAuthorized =
    !allowedRoles ||
    isAdmin ||
    allowedRoles.some((role) => effectiveRoles.has(role.toLowerCase()));

  if (!isAuthorized) {
    // Determine user's primary portal to guide them back safely
    const primaryRole = userRoleNames[0] || "citizen";
    const portalRedirectMap: Record<string, { href: string; name: string }> = {
      citizen: { href: "/citizen", name: "குடிமக்கள் தளம் (Citizen Portal)" },
      officer: { href: "/officer", name: "அலுவலர் தளம் (Officer Portal)" },
      reviewer: { href: "/admin/verification", name: "சரிபார்ப்பு மையம் (Verification Workspace)" },
      admin: { href: "/admin", name: "நிர்வாகக் கட்டுப்பாட்டு மையம் (Admin Center)" },
    };
    const ownPortal = portalRedirectMap[primaryRole] || portalRedirectMap.citizen;

    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
              <span>அணுகல் மறுக்கப்பட்டது • 403 Forbidden</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              அங்கீகரிக்கப்படாத தளம்
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              நீங்கள் தற்போது <strong>{user.full_name}</strong> ({primaryRole.toUpperCase()}) ஆக உள்நுழைந்துள்ளீர்கள்.
              இந்த பகுதி <strong>{allowedRoles?.map(r => r.toUpperCase()).join(", ")}</strong> பொறுப்புடையவர்களுக்கு மட்டுமே ஒதுக்கப்பட்டுள்ளது.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              பாதுகாப்பு தகவல் (Security Notice)
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              தகவல் தொழில்நுட்ப சட்டம் 2000 மற்றும் DPDPA 2023 விதிமுறைகளின்படி அங்கீகரிக்கப்படாத அரசு தள அணுகல் முயற்சிகள் தணிக்கைப் பதிவேட்டில் (Audit Log) பதிவு செய்யப்படும்.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href={ownPortal.href}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>{ownPortal.name} க்குச் செல்</span>
            </Link>
            <Link
              href="/"
              className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <Home className="h-4 w-4" />
              <span>முகப்பு</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Access
  return <>{children}</>;
}
