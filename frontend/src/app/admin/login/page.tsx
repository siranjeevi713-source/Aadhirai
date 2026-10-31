"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectAdminLogin() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8 text-center text-xs text-slate-400">
      அதிகாரப்பூர்வ உள்நுழைவுப் பக்கத்திற்குத் திருப்பிவிடப்படுகிறது... (Redirecting to Unified Login...)
    </div>
  );
}
