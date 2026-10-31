"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

interface IntroAnimationProps {
  onComplete?: () => void;
  targetUrl?: string;
  durationMs?: number;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({
  onComplete,
  targetUrl = "/login",
  durationMs = 3000,
}) => {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setIsReducedMotion(mediaQuery.matches);
    }
  }, []);

  const handleFinish = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("aadhirai_intro_played", "true");
    }
    if (onComplete) {
      onComplete();
    } else {
      router.push(targetUrl);
    }
  };

  useEffect(() => {
    if (isReducedMotion) {
      const timer = setTimeout(handleFinish, 1000);
      return () => clearTimeout(timer);
    }

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const currentProgress = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(currentProgress);

      if (elapsed < durationMs) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        handleFinish();
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [durationMs, isReducedMotion]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-[#0B2545] text-white p-6 sm:p-12 select-none overflow-hidden">
      {/* Top Bar with Municipal Seal & Skip Button */}
      <div className="w-full max-w-4xl flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase">
            தமிழ்நாடு அரசு • முசிறி நகராட்சி
          </span>
        </div>

        <button
          onClick={handleFinish}
          className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
          aria-label="Skip Intro"
        >
          <span>உடனே தொடர (Skip Intro)</span>
          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Centre: Premium Logo & Tagline Reveal */}
      <div className="flex flex-col items-center text-center max-w-xl space-y-6">
        {/* Animated Concentric Civic Crest */}
        <div className="relative flex items-center justify-center">
          {/* Outer SVG Pulse Ring */}
          <svg className="w-32 h-32 sm:w-40 sm:h-40 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-slate-800"
              strokeWidth="3"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-teal-400 transition-all duration-75"
              strokeWidth="3.5"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progress) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Central AADHIRAI Diamond Brand Logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-tr from-[#0B2545] to-[#13315C] border-2 border-teal-400/80 shadow-2xl flex items-center justify-center">
              {/* Diamond SVG matching AadhiraiBrandLogo — 4 quadrant segments */}
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-lg">
                <path d="M24 4L11 17C8.5 19.5 8.5 23.5 11 26L16 21L24 13L24 4Z" fill="#13C6B5" />
                <path d="M24 4L37 17C39.5 19.5 39.5 23.5 37 26L32 21L24 13L24 4Z" fill="#0EA5E9" />
                <path d="M24 44L37 31C39.5 28.5 39.5 24.5 37 22L32 27L24 35L24 44Z" fill="#075CE5" />
                <path d="M24 44L11 31C8.5 28.5 8.5 24.5 11 22L16 27L24 35L24 44Z" fill="#082D50" />
                <rect x="20" y="20" width="8" height="8" transform="rotate(45 24 24)" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
          </div>
        </div>

        {/* Identity & Typography */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-300 text-[11px] font-bold tracking-widest uppercase">
            <span>Civic Accountability Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-3">
            <span>ஆதிரை</span>
            <span className="text-teal-300 font-sans text-3xl sm:text-4xl font-extrabold">AADHIRAI</span>
          </h1>

          <div className="pt-2 max-w-md mx-auto">
            <p className="text-sm sm:text-base font-semibold text-slate-200 leading-snug">
              &ldquo;Complaints don&apos;t end at submit. They end at proof.&rdquo;
            </p>
            <p className="text-xs text-slate-400 mt-1">
              (புகார்கள் சமர்ப்பிப்பில் முடிவதில்லை. அவை ஆதாரத்தில் முடிகின்றன.)
            </p>
          </div>
        </div>
      </div>

      {/* Bottom: Progress Bar & Timer */}
      <div className="w-full max-w-md space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>உள்நுழைவுப் பக்கத்திற்குச் செல்கிறது...</span>
          <span>{Math.round((progress / 100) * 3)}வி / 3s</span>
        </div>

        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-teal-300 transition-all duration-75 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default IntroAnimation;

