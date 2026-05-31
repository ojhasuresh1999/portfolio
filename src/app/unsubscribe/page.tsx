"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleUnsubscribe = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token && !email) {
      setStatus("error");
      setMessage("Please provide your email address.");
      return;
    }

    setStatus("loading");
    try {
      await apiClient.post("/newsletter/unsubscribe", {
        token,
        email: !token ? email : undefined,
      });

      setStatus("success");
      setMessage("You have been successfully unsubscribed.");
    } catch (err) {
      setStatus("error");
      let errorMessage = "An error occurred. Please try again.";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        if (axiosErr.response?.data?.error) {
          errorMessage = axiosErr.response.data.error;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setMessage(errorMessage);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 relative z-10">
      <div className="absolute inset-0 bg-black/60 z-[-1] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.05] rounded-full blur-[100px] pointer-events-none z-[-1]" />

      <div className="w-full max-w-md bg-[#0a0f1e]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Animated gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="flex justify-center mb-6 relative">
          <div
            className={cn(
              "size-16 rounded-2xl flex items-center justify-center border relative z-10",
              status === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-primary/10 border-primary/20 text-primary",
            )}
          >
            <span className="material-symbols-outlined text-3xl">
              {status === "success" ? "check_circle" : "mail_off"}
            </span>
          </div>
          {/* Subtle glow behind icon */}
          <div
            className={cn(
              "absolute inset-0 blur-2xl z-0",
              status === "success" ? "bg-emerald-500/20" : "bg-primary/20",
            )}
          />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-3">
            {status === "success"
              ? "Unsubscribed"
              : "Unsubscribe from Newsletter"}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            {status === "success"
              ? "We've removed your email from our mailing list. We're sorry to see you go!"
              : "Are you sure you want to stop receiving updates, tech insights, and new articles?"}
          </p>
        </div>

        {status === "success" ? (
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-semibold text-sm border border-white/10"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Return Home
          </Link>
        ) : (
          <form onSubmit={handleUnsubscribe} className="space-y-4">
            {!token && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 font-[family-name:var(--font-mono)]">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-[18px]">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-[family-name:var(--font-mono)]"
                  />
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-red-400 shrink-0">
                  error
                </span>
                <p className="text-sm text-red-400 leading-tight pt-0.5">
                  {message}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="group flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-primary/10 hover:bg-primary hover:text-black hover:shadow-[0_0_20px_rgba(0,242,255,0.2)] text-primary border border-primary/20 rounded-xl transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? (
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-1">
                  logout
                </span>
              )}
              {status === "loading" ? "Processing..." : "Yes, Unsubscribe Me"}
            </button>

            <div className="text-center mt-6">
              <Link
                href="/"
                className="text-xs text-slate-500 hover:text-white transition-colors underline-offset-4 hover:underline font-[family-name:var(--font-mono)] uppercase tracking-wider"
              >
                Cancel & Return
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">
            progress_activity
          </span>
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
