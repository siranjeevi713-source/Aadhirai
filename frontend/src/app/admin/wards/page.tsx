"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api/client";
import { Ward } from "@/lib/types";
import { ArrowLeft, MapPin, Compass } from "lucide-react";

export default function AdminWardsPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Ward[]>("/admin/wards")
      .then((data) => setWards(data))
      .catch(() => setWards([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>கட்டளை மையத்திற்குத் திரும்பு (Back)</span>
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          முசிறி நகராட்சி 24 வார்டுகள் (24 Municipal Wards)
        </h1>
        <p className="text-xs text-slate-500">
          தானியங்கி புவியியல் சார்ந்த குறைதீர்ப்பு எல்லைகள் (Spatial Radius: 1000m)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {wards.map((w) => (
          <div
            key={w.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                வார்டு {w.ward_number}
              </span>
              <Compass className="h-4 w-4 text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">{w.name_ta}</h3>
            <p className="text-[11px] text-slate-500">{w.name_en}</p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 font-mono text-[10px] text-slate-400 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{w.center_lat}, {w.center_lon}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
