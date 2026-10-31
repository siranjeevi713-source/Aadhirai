"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n/context";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const { t } = useTranslation();

  const getStatusStyles = () => {
    switch (status) {
      case "SUBMITTED":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300";
      case "IN_PROGRESS":
        return "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300";
      case "RESOLVED_PENDING_VERIFICATION":
        return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300";
      case "VERIFIED_RESOLVED":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold";
      case "NEEDS_REVIEW":
        return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300";
      case "DISPUTED":
        return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 font-semibold";
      case "REOPENED":
        return "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getDotColor = () => {
    switch (status) {
      case "VERIFIED_RESOLVED":
        return "bg-emerald-500";
      case "DISPUTED":
      case "REOPENED":
        return "bg-red-500";
      case "IN_PROGRESS":
        return "bg-indigo-500 animate-pulse";
      default:
        return "bg-amber-500";
    }
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  }[size];

  const label = (t as any)[status] || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors ${sizeClasses} ${getStatusStyles()}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${getDotColor()}`} />
      {label}
    </span>
  );
};
