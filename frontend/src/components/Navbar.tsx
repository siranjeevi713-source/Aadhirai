"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import AadhiraiBrandLogo from "@/components/AadhiraiBrandLogo";
import {
  Globe,
  User,
  LogOut,
  Menu,
  X,
  FileCheck2,
  Users,
  HardHat,
  LayoutDashboard,
  PlusCircle,
  Search,
  PhoneCall,
  UserPlus,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { language, toggleLanguage } = useTranslation();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const getUserWorkspace = () => {
    if (!user || !user.roles) return null;
    const roleNames = user.roles.map((r: any) => r.name.toLowerCase());
    if (roleNames.includes("admin")) {
      return { path: "/admin", label: "Dashboard", icon: LayoutDashboard };
    }
    if (roleNames.includes("reviewer")) {
      return { path: "/admin/verification", label: "Verification", icon: FileCheck2 };
    }
    if (roleNames.includes("officer")) {
      return { path: "/officer", label: "Dashboard", icon: HardHat };
    }
    return { path: "/citizen", label: "Dashboard", icon: Users };
  };

  const workspace = mounted ? getUserWorkspace() : null;

  return (
    <header className="sticky top-0 z-50 w-full shadow-xs">
      {/* 1. Official Government Utility Strip */}
      <div className="bg-[#082D50] text-slate-200 text-[11px] font-medium border-b border-[#064A86]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-white tracking-wide">
              தமிழ்நாடு அரசு | Government of Tamil Nadu
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden sm:inline">
              முசிறி நகராட்சி (Musiri Municipality)
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="tel:18004250101"
              className="hidden md:flex items-center gap-1.5 text-slate-200 hover:text-amber-300 transition-colors"
              title="Musiri Municipal Grievance Helpline"
            >
              <PhoneCall className="h-3 w-3 text-amber-400" />
              <span>உதவி எண்: 1800-425-0101</span>
            </a>

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider transition-colors border border-white/20 cursor-pointer"
              aria-label="Toggle language between Tamil and English"
            >
              <Globe className="h-3 w-3 text-teal-300" />
              <span>{language === "ta" ? "English" : "தமிழ்"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Institutional Navigation Bar matching Reference 2 */}
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* Brand Logo with exact diamond icon */}
          <Link href="/" className="flex items-center gap-2">
            <AadhiraiBrandLogo size="md" variant="dark" />
          </Link>

          {/* Desktop Navigation Links matching Reference 2 */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-700">
            <Link
              href="/"
              className={`hover:text-[#075CE5] transition-colors ${pathname === "/" ? "text-[#075CE5] font-bold" : ""
                }`}
            >
              Home
            </Link>
            <a
              href="#about"
              className="hover:text-[#075CE5] transition-colors"
            >
              About
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#075CE5] transition-colors"
            >
              How It Works
            </a>
            <Link
              href="/explore"
              className={`hover:text-[#075CE5] transition-colors ${pathname === "/explore" ? "text-[#075CE5] font-bold" : ""
                }`}
            >
              Public Map
            </Link>
            {workspace ? (
              <Link
                href={workspace.path}
                className="hover:text-[#075CE5] transition-colors text-blue-600 font-bold"
              >
                {workspace.label}
              </Link>
            ) : (
              <Link
                href="/login"
                className="hover:text-[#075CE5] transition-colors"
              >
                Dashboard
              </Link>
            )}
            <a
              href="#contact"
              className="hover:text-[#075CE5] transition-colors"
            >
              Contact
            </a>
          </nav>

          {/* Right Action & Account Area */}
          <div className="hidden sm:flex items-center gap-3">
            {mounted && user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={workspace?.path || "/citizen"}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-blue-600" />
                  <span>{user.full_name?.split(" ")[0] || "My Account"}</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/citizen/submit"
                  className="px-4 py-2 rounded-xl bg-[#075CE5] hover:bg-[#064ec7] text-white text-xs font-bold shadow-sm transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-slate-200 p-4 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-800"
          >
            Home
          </Link>
          <Link
            href="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-800"
          >
            Public Map
          </Link>
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-800"
          >
            Login
          </Link>
          <Link
            href="/register"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-800"
          >
            Sign Up
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;
