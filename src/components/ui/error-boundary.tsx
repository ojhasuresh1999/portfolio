"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
  title = "System Failure",
  message = "An unexpected anomaly occurred while fetching data.",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  message?: string;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-obsidian text-slate-300">
      <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-lg w-full shadow-[0_0_50px_rgba(239,68,68,0.1)]">
        <span className="material-symbols-outlined text-6xl text-red-500 mb-6 block animate-pulse">
          error
        </span>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400 text-sm mb-8">{message}</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Reboot Sequence
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-2.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <span className="material-symbols-outlined text-lg">home</span>
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
