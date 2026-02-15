"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// =============================================================================
// Admin Login Page
// Design: ACCESS_GRANTED terminal aesthetic
// =============================================================================

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [stayLinked, setStayLinked] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const loginMutation = useMutation({
    mutationFn: async (credentials: {
      email: string;
      password: string;
      stayLinked: boolean;
    }) => {
      const response = await apiClient.post("/admin/auth/login", credentials);
      return response.data;
    },
    onSuccess: (data) => {
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

      // If 2FA not set up, redirect to setup page
      if (!data.user?.twoFactorEnabled) {
        router.push("/admin/settings/2fa");
        return;
      }

      // Redirect to admin dashboard
      router.push("/admin");
    },
    onError: (err: { error?: string }) => {
      setError(err.error || "Authentication failed");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    loginMutation.mutate({ email, password, stayLinked });
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
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        </div>

        {/* Login Card */}
        <div className="relative z-10 w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-[#0c0e14]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Top Highlight Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            {/* Title */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <span className="material-symbols-outlined text-3xl text-primary">
                  encrypted
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-mono)] tracking-tight">
                ACCESS CONTROL
              </h1>
              <p className="text-slate-400 text-xs mt-2 font-[family-name:var(--font-mono)]">
                SECURE AUTHENTICATION GATEWAY
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="group">
                <label className="block text-[10px] text-slate-500 font-[family-name:var(--font-mono)] uppercase tracking-wider mb-2 ml-1">
                  Identity_Email
                </label>
                <div className="relative transform transition-all duration-200 group-focus-within:scale-[1.02]">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">
                      alternate_email
                    </span>
                  </span>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="dev@backend.node"
                    className="w-full pl-12 pr-4 py-3.5 bg-[#1a1d25]/50 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all font-[family-name:var(--font-mono)] text-sm"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <label className="block text-[10px] text-slate-500 font-[family-name:var(--font-mono)] uppercase tracking-wider mb-2 ml-1">
                  Access_Token
                </label>
                <div className="relative transform transition-all duration-200 group-focus-within:scale-[1.02]">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">
                      key
                    </span>
                  </span>
                  <input
                    ref={passwordRef}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3.5 bg-[#1a1d25]/50 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all font-[family-name:var(--font-mono)] text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={stayLinked}
                      onChange={(e) => setStayLinked(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-4 h-4 rounded border border-white/20 bg-[#1a1d25] peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors select-none font-[family-name:var(--font-mono)]">
                    Keep Session Active
                  </span>
                </label>
                <Link
                  href="/admin/recover"
                  className="text-xs text-primary/80 hover:text-primary transition-colors font-[family-name:var(--font-mono)] underline-offset-4 hover:underline"
                >
                  RECOVER_CREDENTIALS
                </Link>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"
                  >
                    <span className="material-symbols-outlined text-base">
                      warning
                    </span>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full py-4 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-[family-name:var(--font-mono)] text-sm uppercase tracking-wider shadow-lg shadow-primary/20 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                {loginMutation.isPending ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">
                      progress_activity
                    </span>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate</span>
                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                      login
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Version Info */}
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center text-[10px] text-slate-600 font-[family-name:var(--font-mono)] gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>SYSTEM STATUS: OPTIMAL</span>
              </div>
              <span>|</span>
              <span>ENC: AES-256-GCM</span>
            </div>
          </motion.div>
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
