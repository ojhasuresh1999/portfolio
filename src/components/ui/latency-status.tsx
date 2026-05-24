"use client";

import { useState, useEffect } from "react";

interface LatencyState {
  latency: number | null;
  status: "online" | "offline";
}

const PING_INTERVAL_MS = 30_000; // 30 seconds

export function LatencyStatus({ statusText }: { statusText: string }) {
  const [state, setState] = useState<LatencyState>({
    latency: null,
    status: "online",
  });

  useEffect(() => {
    const ping = async () => {
      const start = performance.now();
      try {
        // Simple client-side health check, or just check standard endpoint
        await fetch("/api/admin/profile/presence", { method: "HEAD" }).catch(
          () => {},
        );
        const elapsed = Math.round(performance.now() - start);
        setState({ latency: elapsed, status: "online" });
      } catch {
        setState((prev) => ({ ...prev, status: "offline" }));
      }
    };

    ping();
    const interval = setInterval(ping, PING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const isOnline = state.status === "online";
  const latencyDisplay = state.latency !== null ? `${state.latency}ms` : "--ms";

  return (
    <>
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
          {isOnline ? statusText : "OFFLINE"}
        </span>
      </p>
      <p>
        LATENCY:{" "}
        <span className={isOnline ? "text-emerald-500/80" : "text-slate-500"}>
          {latencyDisplay}
        </span>
      </p>
    </>
  );
}
