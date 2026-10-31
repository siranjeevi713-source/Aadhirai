"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import api from "@/lib/api/client";
import { Category, Complaint } from "@/lib/types";
import {
  ShieldCheck,
  Upload,
  MapPin,
  Mic,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
  Camera,
} from "lucide-react";

export default function SubmitComplaintPage() {
  const { t } = useTranslation();
  const { user, quickLoginAs } = useAuth();
  const router = useRouter();

  // Categories list
  const [categories, setCategories] = useState<Category[]>([]);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [latitude, setLatitude] = useState<number>(10.9413);
  const [longitude, setLongitude] = useState<number>(78.4485);
  const [landmark, setLandmark] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // AI & Duplicate check state
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<any[]>([]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    api.get<Category[]>("/admin/categories")
      .then((data) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  // Handle live AI classification when description changes (debounced)
  useEffect(() => {
    if (!description || description.trim().length < 8) {
      setAiSuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      setAiLoading(true);
      try {
        const formData = new FormData();
        formData.append("description", description);
        if (selectedFile) {
          formData.append("image_file", selectedFile);
        }
        const res = await api.post<any>("/ai/classify", formData);
        setAiSuggestion(res);
        // Pre-select category if not selected yet
        if (!categoryId && categories.length > 0) {
          const match = categories.find((c) => c.code === res.suggested_category);
          if (match) {
            setCategoryId(match.id);
          }
        }
      } catch {
        // AI assistance is advisory; ignore error
      } finally {
        setAiLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [description, selectedFile, categoryId, categories]);

  // Handle duplicate check when category and coordinates are set
  useEffect(() => {
    if (!categoryId) return;
    api.post<any[]>("/ai/duplicate-check", {
      latitude,
      longitude,
      category_id: categoryId,
    })
      .then((matches) => setDuplicateWarning(matches))
      .catch(() => setDuplicateWarning([]));
  }, [categoryId, latitude, longitude]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDetectGPS = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Number(pos.coords.latitude.toFixed(6)));
          setLongitude(Number(pos.coords.longitude.toFixed(6)));
        },
        () => {
          // Default to Musiri Center
          setLatitude(10.9413);
          setLongitude(78.4485);
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Auto login as citizen if guest
      if (!user) {
        await quickLoginAs("citizen");
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      if (categoryId) formData.append("category_id", categoryId);
      formData.append("latitude", latitude.toString());
      formData.append("longitude", longitude.toString());
      if (landmark) formData.append("landmark", landmark);
      formData.append("language", "ta");
      formData.append("priority", aiSuggestion?.severity || "MEDIUM");
      if (selectedFile) {
        formData.append("evidence_file", selectedFile);
      }

      const res = await api.post<Complaint>("/complaints", formData);
      setSubmittedComplaint(res);
    } catch (err: any) {
      setError(err.message || "புகார் சமர்ப்பித்தல் தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedComplaint) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-emerald-200 shadow-2xl text-center space-y-6">
          <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              புகார் வெற்றிகரமாகப் பதிவு செய்யப்பட்டது
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              குறியீட்டு எண்: {submittedComplaint.public_reference}
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              உங்கள் புகார் நகராட்சி பொறுப்புடைமை இயந்திரத்தால் தானாக வார்டு மற்றும் பொறுப்புத் துறைக்கு அனுப்பப்பட்டுள்ளது.
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-left text-xs space-y-2 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">ஒதுக்கப்பட்ட வார்டு:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {submittedComplaint.ward?.name_ta || "முசிறி வார்டு"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">துறை:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {submittedComplaint.assigned_department?.name_ta || "பொதுத்துறை"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">SLA காலக்கெடு:</span>
              <span className="font-bold text-indigo-600">
                {submittedComplaint.due_at ? new Date(submittedComplaint.due_at).toLocaleString() : "48 மணிநேரம்"}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => router.push(`/citizen/complaints/${submittedComplaint.id}`)}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500"
            >
              புகார் விவரங்களைப் பார்
            </button>
            <button
              onClick={() => router.push("/citizen")}
              className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100"
            >
              குடிமக்கள் தளத்திற்குத் திரும்பு
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold dark:bg-indigo-950 dark:text-indigo-300">
          <ShieldCheck className="h-4 w-4" />
          <span>ஆதார அடிப்படையிலான குறைதீர்ப்பு</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          புதிய புகார் சமர்ப்பித்தல் (Submit Grievance)
        </h1>
        <p className="text-xs text-slate-500">
          புகைப்பட ஆதாரம் மற்றும் ஜி.பி.எஸ் தகவலுடன் உங்கள் புகாரைப் பதிவு செய்யவும்.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            புகார் சுருக்கத் தலைப்பு *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="எ.கா: காவேரி நகர் மெயின் ரோட்டில் பெரிய குழி விபத்து அபாயம்"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              முழு விவரம் (Description) *
            </label>
            <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              ஹைபிரிட் AI தானியங்கி பகுப்பாய்வு
            </span>
          </div>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="பிரச்சனையின் தன்மை, பாதிப்பு விவரங்களை தமிழில் அல்லது ஆங்கிலத்தில் விவரிக்கவும்..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-none"
          />

          {/* AI Suggestion Box */}
          {aiLoading && (
            <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-500 animate-pulse flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>AI உங்கள் விவரிப்பை ஆய்வு செய்கிறது...</span>
            </div>
          )}

          {aiSuggestion && !aiLoading && (
            <div className="mt-2 p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  AI பரிந்துரைத்த துறை வகை: {aiSuggestion.suggested_category}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800 font-semibold">
                  {Math.round(aiSuggestion.confidence * 100)}% நம்பிக்கை
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                காரணம்: {aiSuggestion.reason}
              </p>
            </div>
          )}
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            துறை வகை (Category) *
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-none"
          >
            <option value="">துறை வகையைத் தேர்ந்தெடுக்கவும்</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_ta} ({c.name_en})
              </option>
            ))}
          </select>
        </div>

        {/* Duplicate Warning Banner */}
        {duplicateWarning.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>இதே பகுதியில் ஏற்கனவே {duplicateWarning.length} புகார் பதிவாகியுள்ளது!</span>
            </div>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300">
              அருகிலுள்ள குறிப்பு: {duplicateWarning[0].public_reference} ({duplicateWarning[0].distance_meters} மீ தள்ளி). உங்கள் புகார் இதனுடன் இணைக்கப்படலாம்.
            </p>
          </div>
        )}

        {/* Evidence Photo Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            ஆதாரப் புகைப்படம் / வீடியோ (Evidence Upload)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-2xl hover:border-indigo-500 transition-colors bg-slate-50 dark:bg-slate-800/30">
            <div className="space-y-2 text-center">
              {previewUrl ? (
                <div className="relative mx-auto max-w-[240px] rounded-xl overflow-hidden shadow-md">
                  <img src={previewUrl} alt="Preview" className="w-full h-auto object-cover max-h-48" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 text-[10px]"
                  >
                    மாற்று
                  </button>
                </div>
              ) : (
                <>
                  <Camera className="mx-auto h-10 w-10 text-slate-400" />
                  <div className="flex text-xs text-slate-600 dark:text-slate-400">
                    <label className="relative cursor-pointer rounded-md font-bold text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                      <span>புகைப்படம் தேர்ந்தெடுக்க</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">அல்லது இங்கே இழுத்துப் போடவும்</p>
                  </div>
                  <p className="text-[10px] text-slate-400">JPG, PNG, WebP up to 15MB</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* GPS Coordinates & Landmark */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                ஜி.பி.எஸ் அட்சரேகை (Lat)
              </label>
              <button
                type="button"
                onClick={handleDetectGPS}
                className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1"
              >
                <MapPin className="h-3 w-3" />
                தற்போதைய இடம் பெறு
              </button>
            </div>
            <input
              type="number"
              step="any"
              required
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              ஜி.பி.எஸ் தீர்க்கரேகை (Lon)
            </label>
            <input
              type="number"
              step="any"
              required
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            அடையாளம் / தெருப் பெயர் (Landmark)
          </label>
          <input
            type="text"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="எ.கா: பழைய அரசு மருத்துவமனை அருகில், வார்டு 7"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 focus:outline-none disabled:opacity-50 transition-all"
        >
          {submitting ? "பதிவேற்றப்படுகிறது..." : "புகாரை உறுதிசெய்து சமர்ப்பி (Submit Grievance)"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
