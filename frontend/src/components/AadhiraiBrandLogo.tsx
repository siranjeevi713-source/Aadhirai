import React from "react";

export interface AadhiraiBrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light" | "white";
  layout?: "vertical" | "horizontal" | "icon-only";
  showTagline?: boolean;
}

export const AadhiraiBrandLogo: React.FC<AadhiraiBrandLogoProps> = ({
  className = "",
  size = "md",
  variant = "dark",
  layout = "horizontal",
  showTagline = false,
}) => {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const titleSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const subSizes = {
    sm: "text-[9px]",
    md: "text-[11px]",
    lg: "text-xs",
    xl: "text-sm",
  };

  const textColor =
    variant === "white"
      ? "text-white"
      : variant === "light"
        ? "text-slate-100"
        : "text-[#082D50] dark:text-white";

  const subColor =
    variant === "white"
      ? "text-[#13C6B5]"
      : variant === "light"
        ? "text-teal-300"
        : "text-[#13C6B5]";

  const containerClasses =
    layout === "vertical"
      ? `flex flex-col items-center text-center gap-2 ${className}`
      : `flex items-center gap-2.5 ${className}`;

  return (
    <div className={containerClasses}>
      {/* Precision Geometric Diamond Emblem matching Reference Image 1 & 2 */}
      <div className={`relative shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm filter"
        >
          {/* Top-Left Quadrant: Civic Emerald Teal (#13C6B5) - Community & Sustainability */}
          <path
            d="M24 4L11 17C8.5 19.5 8.5 23.5 11 26L16 21L24 13L24 4Z"
            fill="#13C6B5"
          />
          {/* Top-Right Quadrant: Connected Cyan (#0EA5E9) - Location Intelligence & GIS */}
          <path
            d="M24 4L37 17C39.5 19.5 39.5 23.5 37 26L32 21L24 13L24 4Z"
            fill="#0EA5E9"
          />
          {/* Bottom-Right Quadrant: Action Royal Blue (#075CE5) - Department Routing & Progress */}
          <path
            d="M24 44L37 31C39.5 28.5 39.5 24.5 37 22L32 27L24 35L24 44Z"
            fill="#075CE5"
          />
          {/* Bottom-Left Quadrant: Institutional Navy (#082D50) - Municipal Governance & Proof */}
          <path
            d="M24 44L11 31C8.5 28.5 8.5 24.5 11 22L16 27L24 35L24 44Z"
            fill="#082D50"
          />
          {/* Central Keystone Diamond Core (Accountability Node) */}
          <rect
            x="20"
            y="20"
            width="8"
            height="8"
            transform="rotate(45 24 24)"
            fill="white"
            fillOpacity="0.95"
          />
        </svg>
      </div>

      {layout !== "icon-only" && (
        <div className={`flex flex-col leading-tight ${layout === "vertical" ? "items-center" : ""}`}>
          <span className={`font-black tracking-tight ${titleSizes[size]} ${textColor} uppercase font-sans`}>
            AADHIRAI
          </span>
          <span className={`font-bold tracking-widest ${subSizes[size]} ${subColor} uppercase`}>
            Nammaoor AI
          </span>
          {showTagline && (
            <span className="text-[10px] text-slate-400 mt-0.5 font-medium tracking-normal">
              Civic Accountability Engine
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AadhiraiBrandLogo;
