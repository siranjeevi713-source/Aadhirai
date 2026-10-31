"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api/client";
import { ArrowLeft, ShieldAlert, Clock, Database } from "lucide-react";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any[]>("/admin/audit-logs")
      .then((data) => setLogs(data))
      .catch(() => setLogs([]))
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-amber-600" />
          <span>தணிக்கைப் பதிவுகள் (Immutable Audit Trail)</span>
        </h1>
        <p className="text-xs text-slate-500">
          அரசு மற்றும் குடிமக்கள் நடவடிக்கைகளின் மாற்றமுடியாத பாதுகாப்பு தணிக்கை வரலாறு
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-xs text-slate-400">தணிக்கைப் பதிவுகள் ஏற்றப்படுகின்றன...</p>
        ) : logs.length === 0 ? (
          <p className="p-8 text-center text-xs text-slate-400">பதிவுகள் ஏதுமில்லை.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {logs.map((log) => (
              <div key={log.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {log.action}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                      {log.entity_type}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{log.details}</p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0 font-mono">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
