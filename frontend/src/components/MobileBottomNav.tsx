"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, MapPin, User, PlusCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/context";

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  // Hide on login page or intro
  if (pathname === "/login") {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg">
      {/* Home */}
      <Link
        href="/"
        className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
          isActive("/") && pathname === "/" ? "text-[#075CE5] font-bold" : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <Home className="w-4 h-4" />
        <span>Home</span>
      </Link>

      {/* Complaints */}
      <Link
        href="/citizen"
        className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
          isActive("/citizen") && !pathname.includes("/submit") ? "text-[#075CE5] font-bold" : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <FileText className="w-4 h-4" />
        <span>Complaints</span>
      </Link>

      {/* Central Report Action Button */}
      <Link
        href="/citizen/submit"
        className="flex flex-col items-center -mt-5"
      >
        <div className="w-11 h-11 rounded-full bg-[#075CE5] text-white flex items-center justify-center shadow-lg hover:bg-[#064ec7] transition-transform active:scale-95">
          <PlusCircle className="w-6 h-6" />
        </div>
        <span className="text-[9px] font-bold text-[#075CE5] mt-0.5">Report</span>
      </Link>

      {/* Map */}
      <Link
        href="/explore"
        className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
          isActive("/explore") ? "text-[#075CE5] font-bold" : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <MapPin className="w-4 h-4" />
        <span>Map</span>
      </Link>

      {/* Profile */}
      <Link
        href={user ? "/citizen" : "/login"}
        className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
          pathname === "/login" || pathname.includes("/profile")
            ? "text-[#075CE5] font-bold"
            : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <User className="w-4 h-4" />
        <span>Profile</span>
      </Link>
    </nav>
  );
};

export default MobileBottomNav;

