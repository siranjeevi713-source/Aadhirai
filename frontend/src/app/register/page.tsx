"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import api from "@/lib/api/client";
import AadhiraiBrandLogo from "@/components/AadhiraiBrandLogo";
import {
  ShieldCheck,
  Phone,
  Lock,
  User,
  Mail,
  ArrowRight,
  AlertCircle,
  Building2,
  MapPin,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function CitizenRegisterPage() {
  const { language, setLanguage, t } = useTranslation();
  const { login } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post<{ access_token: string; user: any }>("/auth/register", {
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
        preferred_language: language,
      });

      login(res.access_token, res.user);
      router.push("/citizen");
    } catch (err: any) {
      setError(
        err.message ||
          (language === "ta"
            ? "பதிவு தோல்வியடைந்தது. விவரங்களைச் சரிபார்க்கவும்."
            : "Registration failed. Please check the provided details.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Column: Civic Identity Panel */}
        <div className="md:col-span-5 bg-[#0B2545] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B2545]/90 via-[#0B2545]/95 to-[#0A192F] z-10" />

          {/* Authentic Civic Photo (Urban street infrastructure) */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80')",
            }}
          />

          <div className="relative z-20 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              <span>குடிமக்கள் சேவை முனையம் • முசிறி</span>
            </div>

            <div className="space-y-3">
              <AadhiraiBrandLogo size="lg" variant="white" />
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                முசிறி நகராட்சியில் சாலை, குடிநீர், வடிகால் மற்றும் தெருவிளக்குக் குறைகளை நேரடி புகைப்பட ஆதாரத்துடன் பதிவு செய்யவும்.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <span>புகைப்பட ஆதாரத்துடன் கூடிய எளிமையான குறைதீர்ப்பு</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <span>துறை அதிகாரிகளின் நேரடி களப்பணி முன்னேற்றக் கண்காணிப்பு</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <span>சரிபார்க்கப்பட்ட தீர்வுச் சான்றிதழ் மற்றும் பொதுவெளி வெளிப்படைத்தன்மை</span>
              </div>
            </div>
          </div>

          <div className="relative z-20 pt-8 border-t border-white/10 text-[11px] text-slate-400">
            DPDPA 2023 சட்டத்தின்படி உங்கள் தனிப்பட்ட தகவல்கள் பாதுகாப்பாகப் பராமரிக்கப்படும்.
          </div>
        </div>

        {/* Right Column: Registration Form */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                குடிமக்கள் பதிவு (Citizen Registration)
              </span>

              {/* Language Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLanguage("ta")}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    language === "ta"
                      ? "bg-white dark:bg-slate-700 text-[#0B2545] dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  தமிழ்
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    language === "en"
                      ? "bg-white dark:bg-slate-700 text-[#0B2545] dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <div className="mt-4 mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === "ta" ? "புதிய குடிமக்கள் பதிவு" : "Citizen Registration"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === "ta"
                  ? "கீழே உள்ள படிவத்தை பூர்த்தி செய்து உங்கள் கணக்கை உருவாக்கவும்."
                  : "Fill in the details below to register your citizen account."}
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === "ta" ? "முழுப் பெயர் (Full Name) *" : "Full Name *"}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={language === "ta" ? "எ.கா: செந்தில் குமார்" : "e.g., Senthil Kumar"}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3 py-2.5 text-xs text-slate-900 dark:text-white focus:border-[#0B2545] dark:focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === "ta" ? "தொலைபேசி எண் (Phone Number) *" : "Phone Number *"}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3 py-2.5 text-xs text-slate-900 dark:text-white focus:border-[#0B2545] dark:focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === "ta" ? "மின்னஞ்சல் (Email - விருப்பத்தேர்வு)" : "Email (Optional)"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="citizen@example.com"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3 py-2.5 text-xs text-slate-900 dark:text-white focus:border-[#0B2545] dark:focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === "ta" ? "கடவுச்சொல் (Password) *" : "Password *"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••• (குறைந்தபட்சம் 6 எழுத்துக்கள்)"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3 py-2.5 text-xs text-slate-900 dark:text-white focus:border-[#0B2545] dark:focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#075CE5] hover:bg-[#064ec7] disabled:opacity-50 py-3 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{language === "ta" ? "பதிவாகிறது..." : "Creating Account..."}</span>
                  </>
                ) : (
                  <>
                    <span>{language === "ta" ? "கணக்கு உருவாக்குக (Register Account)" : "Create Account"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {language === "ta" ? "ஏற்கனவே கணக்கு உள்ளதா? " : "Already have an account? "}
                <Link
                  href="/login"
                  className="font-bold text-teal-700 dark:text-teal-400 hover:underline"
                >
                  {language === "ta" ? "உள்நுழைக (Sign In)" : "Sign In Here"}
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-[10px] text-slate-400 text-center">
              அலுவலர் மற்றும் நிர்வாக கணக்குகள் நகராட்சி நிர்வாக அலுவலகத்தால் மட்டுமே உருவாக்கப்படும்.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
