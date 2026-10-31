"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import api from "@/lib/api/client";
import { PublicExploreItem, Category, Ward } from "@/lib/types";
import AadhiraiBrandLogo from "@/components/AadhiraiBrandLogo";
import {
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
  Building2,
  Loader2,
  Eye,
  FileCheck2,
  ExternalLink,
} from "lucide-react";

// Dynamic Leaflet Map Component
const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] rounded-3xl bg-slate-100 flex items-center justify-center animate-pulse">
      <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
    </div>
  ),
});

export default function PublicExplorePage() {
  const [issues, setIssues] = useState<PublicExploreItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters matching Reference Image 2
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    Promise.all([
      api.get<Category[]>("/admin/categories").catch(() => []),
      api.get<PublicExploreItem[]>("/complaints/public/explore").catch(() => []),
    ]).then(([cats, items]) => {
      setCategories(cats || []);
      if (items && items.length > 0) {
        setIssues(items);
      } else {
        // Fallback mock items matching Reference 2
        const mockItems: any[] = [
          {
            id: "exp-1",
            public_reference: "ADH-2024-001",
            reference_number: "ADH-2024-001",
            title: "Pothole on Main Road",
            status: "IN_PROGRESS",
            priority: "HIGH",
            latitude: 10.9413,
            longitude: 78.4485,
            ward: { number: 5, name_en: "Musiri Kaveri River Road" },
            category: { name_en: "Road Damage (Pothole)" },
            created_at: "2024-03-12T10:30:00Z",
            has_proof: false,
          },
          {
            id: "exp-2",
            public_reference: "ADH-2024-002",
            reference_number: "ADH-2024-002",
            title: "Garbage accumulation",
            status: "VERIFIED_RESOLVED",
            priority: "MEDIUM",
            latitude: 10.9435,
            longitude: 78.4512,
            ward: { number: 3, name_en: "Market Ward" },
            category: { name_en: "Garbage Accumulation" },
            created_at: "2024-03-10T09:15:00Z",
            has_proof: true,
          },
          {
            id: "exp-3",
            public_reference: "ADH-2024-003",
            reference_number: "ADH-2024-003",
            title: "Streetlight not working",
            status: "SUBMITTED",
            priority: "MEDIUM",
            latitude: 10.9395,
            longitude: 78.4445,
            ward: { number: 8, name_en: "North Street" },
            category: { name_en: "Broken Streetlight" },
            created_at: "2024-03-08T18:40:00Z",
            has_proof: false,
          },
        ];
        setIssues(mockItems);
      }
      setLoading(false);
    });
  }, []);

  const filteredIssues = issues.filter((item) => {
    if (selectedCategory !== "all" && item.category?.id !== selectedCategory) {
      return false;
    }
    if (statusFilter !== "all") {
      if (statusFilter === "pending" && item.status !== "SUBMITTED" && item.status !== "ASSIGNED") return false;
      if (statusFilter === "progress" && item.status !== "IN_PROGRESS") return false;
      if (statusFilter === "resolved" && item.status !== "VERIFIED_RESOLVED" && item.status !== "CLOSED") return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const ref = (item.reference_number || item.public_reference || "").toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        ref.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F4F8FC] flex flex-col font-sans">
      {/* Top Header matching Reference 2 */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <AadhiraiBrandLogo size="sm" variant="dark" />
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <Link href="/" className="hover:text-blue-600">
            Home
          </Link>
          <Link href="/explore" className="text-blue-600 font-bold">
            Map
          </Link>
          <Link href="/citizen" className="hover:text-blue-600">
            Dashboard
          </Link>
          <Link href="/proof/ADH-2026-MSR-0001" className="hover:text-blue-600">
            Resolved Proofs
          </Link>
        </nav>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 relative">
        {/* Full-width Map */}
        <div className="w-full h-[calc(100vh-60px)]">
          <MapPicker
            lat={10.9413}
            lon={78.4485}
            onLocationChange={() => {}}
          />
        </div>

        {/* Floating Search Bar matching Reference 2 */}
        <div className="absolute top-5 left-5 z-20 w-80 sm:w-96">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location or complaint..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white shadow-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#075CE5]"
            />
          </div>
        </div>

        {/* Floating Filters Card matching Reference 2 */}
        <div className="absolute top-5 right-5 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl space-y-3 w-64 text-xs">
          <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
            Filters
          </h4>

          {/* Categories dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_en}
              </option>
            ))}
          </select>

          {/* Status Radio / Checkboxes matching Reference 2 */}
          <div className="space-y-1.5 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="statusFilter"
                checked={statusFilter === "all"}
                onChange={() => setStatusFilter("all")}
                className="text-blue-600"
              />
              <span className="font-medium text-slate-700">All Statuses</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="statusFilter"
                checked={statusFilter === "pending"}
                onChange={() => setStatusFilter("pending")}
                className="text-amber-500"
              />
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Pending
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="statusFilter"
                checked={statusFilter === "progress"}
                onChange={() => setStatusFilter("progress")}
                className="text-blue-600"
              />
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-[#075CE5]" />
                In Progress
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="statusFilter"
                checked={statusFilter === "resolved"}
                onChange={() => setStatusFilter("resolved")}
                className="text-emerald-500"
              />
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Resolved
              </span>
            </label>
          </div>
        </div>

        {/* Floating Preview Card matching Reference 2 */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                <img
                  src="/images/pothole-before.jpg"
                  alt="Pothole"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono font-bold text-blue-600">
                  #ADH-2024-001
                </div>
                <h4 className="text-xs font-bold text-slate-900">
                  Pothole on Main Road
                </h4>
                <p className="text-[10px] text-slate-500">
                  Ward 5 • 12 Mar 2024
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#075CE5]">
                In Progress
              </span>
              <Link
                href="/citizen/complaints/c-001"
                className="px-3 py-1 rounded-lg bg-[#075CE5] text-white text-[10px] font-bold hover:bg-[#064ec7] transition-colors"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
