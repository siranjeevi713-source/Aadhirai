"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import {
  ShieldCheck,
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
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { t, language, toggleLanguage } = useTranslation();
  const { user, logout, quickLoginAs } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-teal-500 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              ஆதிரை <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">AADHIRAI</span>
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
              {t.pilotBadge}
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            href="/citizen"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
              isActive("/citizen")
                ? "bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950 dark:text-indigo-300"
                : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50 dark:text-slate-300"
            }`}
          >
            <Users className="h-4 w-4" />
            {t.citizenPortal}
          </Link>

          <Link
            href="/officer"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
              isActive("/officer")
                ? "bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950 dark:text-indigo-300"
                : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50 dark:text-slate-300"
            }`}
          >
            <HardHat className="h-4 w-4" />
            {t.officerPortal}
          </Link>

          <Link
            href="/admin"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
              isActive("/admin")
                ? "bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950 dark:text-indigo-300"
                : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50 dark:text-slate-300"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            {t.adminPortal}
          </Link>

          <Link
            href="/proof/ADH-2026-MSR-0001"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
              isActive("/proof")
                ? "bg-teal-50 text-teal-700 font-semibold dark:bg-teal-950 dark:text-teal-300"
                : "text-slate-600 hover:text-teal-600 hover:bg-slate-50 dark:text-slate-300"
            }`}
          >
            <FileCheck2 className="h-4 w-4 text-emerald-600" />
            {t.publicProof}
          </Link>
        </nav>

        {/* Right Tools: Language + Role Switcher + Auth */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Tamil / English"
          >
            <Globe className="h-3.5 w-3.5 text-indigo-600" />
            {language === "ta" ? "English" : "தமிழ்"}
          </button>

          {/* Quick Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
            >
              <span>பங்கு (Role):</span>
              <strong className="text-indigo-600 dark:text-indigo-400 capitalize">
                {user ? user.roles[0]?.name : "Guest"}
              </strong>
            </button>

            {roleSwitcherOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50">
                <p className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  துரித உள்நுழைவு (Quick Test Login)
                </p>
                <button
                  onClick={() => {
                    quickLoginAs("citizen");
                    setRoleSwitcherOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">குடிமகன் (Citizen)</p>
                    <p className="text-[10px] text-slate-500">+91 98765 43210</p>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Switch</span>
                </button>
                <button
                  onClick={() => {
                    quickLoginAs("officer");
                    setRoleSwitcherOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">பொறியாளர் (Officer)</p>
                    <p className="text-[10px] text-slate-500">Ward 7 Roads Eng</p>
                  </div>
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Switch</span>
                </button>
                <button
                  onClick={() => {
                    quickLoginAs("admin");
                    setRoleSwitcherOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">ஆணையர் (Commissioner)</p>
                    <p className="text-[10px] text-slate-500">Super Admin</p>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Switch</span>
                </button>
              </div>
            )}
          </div>

          {/* User Profile or Login CTA */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
              <Link
                href="/citizen/profile"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600"
              >
                <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  {user.full_name.charAt(0)}
                </div>
                <span className="max-w-[100px] truncate">{user.full_name}</span>
              </Link>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition-colors"
                title={t.logout}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/citizen/login"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {t.login}
              </Link>
              <Link
                href="/citizen/register"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
              >
                {t.register}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="p-1.5 rounded-lg border border-slate-200 text-xs font-bold text-indigo-600"
          >
            {language === "ta" ? "EN" : "தமிழ்"}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 dark:border-slate-800 dark:bg-slate-900 shadow-xl">
          <Link
            href="/citizen"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            <Users className="h-4 w-4 text-indigo-600" />
            {t.citizenPortal}
          </Link>
          <Link
            href="/officer"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            <HardHat className="h-4 w-4 text-indigo-600" />
            {t.officerPortal}
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            <LayoutDashboard className="h-4 w-4 text-indigo-600" />
            {t.adminPortal}
          </Link>
          <Link
            href="/proof/ADH-2026-MSR-0001"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            <FileCheck2 className="h-4 w-4 text-teal-600" />
            {t.publicProof}
          </Link>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            {user ? (
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user.full_name}
                </span>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs font-semibold text-red-600"
                >
                  {t.logout}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/citizen/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-bold rounded-lg bg-slate-100 text-slate-800"
                >
                  {t.login}
                </Link>
                <Link
                  href="/citizen/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white"
                >
                  {t.register}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
