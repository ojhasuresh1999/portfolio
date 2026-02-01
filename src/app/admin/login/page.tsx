"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// =============================================================================
// Admin Login Page
// Design: ACCESS_GRANTED terminal aesthetic
// =============================================================================

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [stayLinked, setStayLinked] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, stayLinked }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Authentication failed");
        setIsLoading(false);
        return;
      }

      // If 2FA required, redirect to verification
      if (data.requiresTwoFactor) {
        // Store temporary tokens for 2FA flow
        sessionStorage.setItem("2fa-token", data.twoFactorToken);
        sessionStorage.setItem("2fa-requestId", data.requestId);
        router.push("/admin/verify-2fa");
        return;
      }

      // Store tokens
      localStorage.setItem("admin-token", data.accessToken);
      localStorage.setItem("admin-refresh-token", data.refreshToken);

      // Redirect to admin dashboard
      router.push("/admin");
    } catch {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020204] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#3b82f6] flex items-center justify-center">
            <span className="material-symbols-outlined text-white">
              terminal
            </span>
          </div>
          <span className="text-white font-bold font-[family-name:var(--font-mono)] tracking-wider">
            NODE<span className="text-[#3b82f6]">_</span>ADMIN
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-xs text-[#22c55e] font-[family-name:var(--font-mono)] uppercase tracking-wider">
              System Online
            </span>
          </div>
          <button className="p-2 text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {/* Background Effects */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 shimmer-bg opacity-50" />
          <div className="absolute inset-0 aurora-bg opacity-20" />
        </div>

        {/* Login Card */}
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-[#0c0e14]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Title */}
            <h1 className="text-3xl font-bold text-white mb-2 font-[family-name:var(--font-mono)]">
              ACCESS_GRANTED
            </h1>
            <p className="text-slate-400 text-sm mb-8 font-[family-name:var(--font-mono)]">
              {"> Auth required to manage resources"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-xs text-slate-500 font-[family-name:var(--font-mono)] uppercase tracking-wider mb-2">
                  Identity_Email
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    @
                  </span>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="dev@backend.node"
                    className="w-full pl-10 pr-4 py-4 bg-[#1a1d25] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50 outline-none transition-all font-[family-name:var(--font-mono)]"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs text-slate-500 font-[family-name:var(--font-mono)] uppercase tracking-wider mb-2">
                  Access_Token
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <span className="material-symbols-outlined text-lg">
                      lock
                    </span>
                  </span>
                  <input
                    ref={passwordRef}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-[#1a1d25] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50 outline-none transition-all font-[family-name:var(--font-mono)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={stayLinked}
                    onChange={(e) => setStayLinked(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-[#1a1d25] text-[#3b82f6] focus:ring-[#3b82f6]/50 focus:ring-offset-0"
                  />
                  <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                    Stay Linked
                  </span>
                </label>
                <Link
                  href="/admin/reset-password"
                  className="text-sm text-[#3b82f6] hover:text-[#60a5fa] transition-colors font-[family-name:var(--font-mono)]"
                >
                  RECOVER_ID?
                </Link>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  <span className="material-symbols-outlined text-lg">
                    error
                  </span>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-[family-name:var(--font-mono)] uppercase tracking-wider"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">
                      progress_activity
                    </span>
                    Authenticating...
                  </>
                ) : (
                  <>
                    Initialize Session
                    <span className="material-symbols-outlined">
                      double_arrow
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Version Info */}
            <div className="mt-8 flex items-center justify-between text-xs text-slate-600 font-[family-name:var(--font-mono)]">
              <span>v20.11.0_LTS</span>
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-sm">cloud</span>
                <span className="material-symbols-outlined text-sm">
                  security
                </span>
                <span className="material-symbols-outlined text-sm">
                  download
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between px-6 py-4 border-t border-white/5 text-xs text-slate-600 font-[family-name:var(--font-mono)]">
        <span>© 2024 Backend Infrastructure Protocol</span>
        <div className="flex items-center gap-6">
          <span>LATENCY: 3MS</span>
          <span>ENC: AES-256</span>
          <span>REGION: EU-WEST-1</span>
        </div>
      </footer>
    </div>
  );
}
