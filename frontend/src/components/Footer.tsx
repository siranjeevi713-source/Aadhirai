"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { MapPin, Award, CheckCircle2 } from "lucide-react";
import AadhiraiBrandLogo from "@/components/AadhiraiBrandLogo";

// Hide Footer on dashboard/portal pages — they have their own sidebar layouts
const HIDE_FOOTER_PREFIXES = ["/citizen", "/officer", "/admin", "/reviewer"];

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const pathname = usePathname();

  const shouldHide = HIDE_FOOTER_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (shouldHide) return null;

  return (
    <footer className="border-t border-slate-200 bg-[#082D50] mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <AadhiraiBrandLogo size="md" variant="white" />
            <p className="text-xs text-slate-300 max-w-md leading-relaxed mt-2">
              {t.tagline}
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-300 font-semibold pt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>முசிறி நகராட்சி (Musiri Municipality), திருச்சிராப்பள்ளி மாவட்டம், தமிழ்நாடு</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              தளப் பிரிவுகள் (Portals)
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/citizen" className="hover:text-teal-300 transition-colors">
                  {t.citizenPortal}
                </Link>
              </li>
              <li>
                <Link href="/officer" className="hover:text-teal-300 transition-colors">
                  {t.officerPortal}
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-teal-300 transition-colors">
                  {t.adminPortal}
                </Link>
              </li>
              <li>
                <Link href="/proof/ADH-2026-MSR-0001" className="hover:text-teal-300 transition-colors">
                  {t.publicProof}
                </Link>
              </li>
            </ul>
          </div>

          {/* Verification & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              பொது வெளிப்படைத்தன்மை
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>டிஜிட்டல் பட மறுஆய்வு (pHash)</span>
              </p>
              <p className="flex items-center gap-1.5 text-[#13C6B5] font-semibold">
                <Award className="h-3.5 w-3.5" />
                <span>சுயாதீன தீர்வுச் சான்றிதழ்</span>
              </p>
              <p className="text-[11px] text-slate-500 pt-1">
                DPDPA 2023 விதிகளின்படி குடிமக்கள் தனியுரிமை 100% பாதுகாக்கப்படுகிறது.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <p>© 2026 AADHIRAI GovTech Platform. Powered by Hybrid AI & Musiri Municipal Administration.</p>
          <p className="mt-2 sm:mt-0 font-medium text-slate-400">
            Tamil-First Civic Redressal Engine
          </p>
        </div>
      </div>
    </footer>
  );
};
