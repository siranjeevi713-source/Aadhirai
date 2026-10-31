"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api/client";
import { Department } from "@/lib/types";
import { ArrowLeft, Building2, Phone, Mail } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Department[]>("/admin/departments")
      .then((data) => setDepartments(data))
      .catch(() => setDepartments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute allowedRoles={["admin"]} portalTitle="நகராட்சி துறைகள் (Departments Roster)">
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
          நகராட்சி துறைகள் பட்டியல் (Departments Roster)
        </h1>
        <p className="text-xs text-slate-500">
          முசிறி நகராட்சியில் பொறுப்பு வகிக்கும் 5 முக்கிய நிர்வாகத் துறைகள்
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((d) => (
          <div
            key={d.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{d.name_ta}</h3>
                <p className="text-[11px] text-slate-500">{d.name_en}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Mail className="h-3.5 w-3.5 text-purple-600" />
                <span>{d.contact_email || "இல்லை"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Phone className="h-3.5 w-3.5 text-purple-600" />
                <span>{d.contact_phone || "இல்லை"}</span>
              </div>
              <div className="font-mono text-[10px] text-slate-400">
                Code: {d.code}
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </ProtectedRoute>
  );
}

