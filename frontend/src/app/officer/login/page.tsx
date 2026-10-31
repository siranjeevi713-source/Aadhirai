"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import api from "@/lib/api/client";
import { HardHat, Phone, Lock, ArrowRight, AlertCircle, Sparkles } from "lucide-react";

export default function OfficerLoginPage() {
  const { t } = useTranslation();
  const { login, quickLoginAs } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post<{ access_token: string; user: any }>("/auth/login", {
        phone,
        password,
      });
      login(res.access_token, res.user);
      router.push("/officer");
    } catch (err: any) {
      setError(err.message || "அலுவலர் உள்நுழைவு தோல்வியடைந்தது.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/20">
            <HardHat className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            அரசு அலுவலர் உள்நுழைவு (Officer Login)
          </h2>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            முசிறி நகராட்சி வார்டு பொறியாளர்கள் மற்றும் துறை அலுவலர்களுக்கான தளம்.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              அலுவலக தொலைபேசி எண் (Officer Phone)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43211"
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              கடவுச்சொல் (Password)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-500 focus:outline-none disabled:opacity-50 transition-all"
          >
            {loading ? "உள்நுழைகிறது..." : "அலுவலர் உள்நுழைவு"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Quick Demo Officer Login */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={async () => {
              setLoading(true);
              await quickLoginAs("officer");
              router.push("/officer");
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50/80 py-2.5 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 transition-colors"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>டெமோ அலுவலர் கணக்கில் நுழைய (Demo Officer Login)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
