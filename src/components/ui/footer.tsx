"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
// import { apiClient } from "@/lib/api-client";
import { useSocialLinks, useSettings } from "@/hooks/queries";

// ── Live Latency Hook ────────────────────────

interface LatencyState {
  latency: number | null;
  status: "online" | "offline";
}

const PING_INTERVAL_MS = 30_000; // 30 seconds

function useLatency(): LatencyState {
  const [state, setState] = useState<LatencyState>({
    latency: null,
    status: "online",
  });

  useEffect(() => {
    const ping = async () => {
      const start = performance.now();
      try {
        // await apiClient.get("/health", {
        //   timeout: 5000,
        // });
        const elapsed = Math.round(performance.now() - start);
        setState({ latency: elapsed, status: "online" });
      } catch {
        setState((prev) => ({ ...prev, status: "offline" }));
      }
    };

    // Initial ping
    ping();

    // Periodic ping
    const interval = setInterval(ping, PING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return state;
}

// ── Helper: Map Brand to Material Symbol ──────

const getValidIcon = (iconStr: string) => {
  const i = iconStr.toLowerCase().trim();
  if (i === "github" || i === "git") return "code";
  if (i === "linkedin" || i === "linked") return "link";
  if (i === "twitter" || i === "x") return "tag";
  if (i === "email" || i === "mail" || i === "gmail") return "mail";
  if (i === "facebook" || i === "fb") return "thumb_up";
  if (i === "instagram" || i === "ig") return "photo_camera";
  if (i === "youtube" || i === "yt") return "play_circle";
  return i;
};

// ── Footer Component ─────────────────────────

export function Footer() {
  const { latency, status } = useLatency();
  const { data: socialLinks = [] } = useSocialLinks();
  const { data: settings } = useSettings();

  const isOnline = status === "online";
  const latencyDisplay = latency !== null ? `${latency}ms` : "--ms";

  const siteName = settings?.siteName || "SURESH";
  const statusText = isOnline
    ? settings?.statusText || "OPERATIONAL"
    : "OFFLINE";

  return (
    <footer className="w-full border-t border-white/5 bg-[#020203] px-6 py-12 relative z-30">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Logo & Status */}
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-2 text-white font-bold font-[family-name:var(--font-mono)]">
            <span className="material-symbols-outlined text-primary">
              terminal
            </span>
            <span>{siteName}</span>
          </div>
          <div className="text-slate-600 text-xs font-[family-name:var(--font-mono)] space-y-0.5">
            <p className="flex items-center gap-1.5">
              STATUS:
              <span className="relative flex size-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isOnline ? "bg-emerald-400" : "bg-red-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full size-2 ${
                    isOnline ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
              </span>
              <span className={isOnline ? "text-emerald-500" : "text-red-400"}>
                {statusText}
              </span>
            </p>
            <p>
              LATENCY:{" "}
              <span
                className={isOnline ? "text-emerald-500/80" : "text-slate-500"}
              >
                {latencyDisplay}
              </span>
            </p>
            <p>© {new Date().getFullYear()}</p>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex gap-6">
          {socialLinks
            .filter((l) => l.isVisible)
            .map((link) => (
              <Link
                key={link.platform || link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="size-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary/20 hover:scale-110 transition-all"
                aria-label={link.platform}
              >
                <span className="material-symbols-outlined text-xl truncate overflow-hidden">
                  {getValidIcon(link.icon)}
                </span>
              </Link>
            ))}
        </div>
      </div>
    </footer>
  );
}
