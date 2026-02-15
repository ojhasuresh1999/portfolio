"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// =============================================================================
// Password Reset Page
// Design: Secure Reset with entropy score meter
// =============================================================================

// Password strength calculation
function calculateEntropy(password: string): number {
  if (!password) return 0;

  let charsetSize = 0;
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

  const entropy = password.length * Math.log2(charsetSize || 1);
  return Math.min(entropy, 100);
}

function getStrengthInfo(entropy: number): {
  label: string;
  color: string;
  percentage: number;
} {
  if (entropy < 28) {
    return {
      label: "Weak: Not suitable for production",
      color: "#ef4444",
      percentage: 25,
    };
  }
  if (entropy < 36) {
    return {
      label: "Fair: Minimum requirements met",
      color: "#f59e0b",
      percentage: 50,
    };
  }
  if (entropy < 60) {
    return {
      label: "Strong: Optimal for production environments",
      color: "#22c55e",
      percentage: 75,
    };
  }
  return {
    label: "Excellent: Enterprise-grade security",
    color: "#3b82f6",
    percentage: 100,
  };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const entropy = useMemo(() => calculateEntropy(newPassword), [newPassword]);
  const strengthInfo = useMemo(() => getStrengthInfo(entropy), [entropy]);

  const resetMutation = useMutation({
    mutationFn: async (data: {
      newPassword: string;
      confirmPassword: string;
      resetToken: string | null;
    }) => {
      const response = await apiClient.post("/admin/auth/reset-password", data);
      return response.data;
    },
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/login");
      }, 2000);
    },
    onError: (err: { error?: string }) => {
      setError(err.error || "Password reset failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (entropy < 28) {
      setError("Password is too weak");
      return;
    }

    // Get token from URL if present (forgot password flow)
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get("token");

    resetMutation.mutate({
      newPassword,
      confirmPassword,
      resetToken,
    });
  };

  return (
    <div className="min-h-screen bg-[#020204] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#3b82f6] flex items-center justify-center">
            <span className="material-symbols-outlined text-white">
              deployed_code
            </span>
          </div>
          <span className="text-white font-bold font-[family-name:var(--font-mono)] tracking-wider">
            NODE<span className="text-[#3b82f6]">.</span>JS{" "}
            <span className="text-[#3b82f6]">CORE</span>
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <Link href="/" className="hover:text-white transition-colors">
            Portfolio
          </Link>
          <Link href="/docs" className="hover:text-white transition-colors">
            Documentation
          </Link>
          <Link
            href="/admin/settings"
            className="hover:text-white transition-colors"
          >
            Security
          </Link>
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-amber-500">
              person
            </span>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        </div>

        {/* Reset Card */}
        <div className="relative z-10 w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-[#0c0e14]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Top Highlight Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

            {/* Title */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 mb-4 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <span className="material-symbols-outlined text-3xl text-emerald-500">
                  lock_reset
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-mono)] tracking-tight">
                SECURE RESET
              </h1>
              <p className="text-slate-400 text-xs mt-2 font-[family-name:var(--font-mono)]">
                CREDENTIAL UPDATE PROTOCOL
              </p>
            </div>

            {success ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <span className="material-symbols-outlined text-emerald-500 text-4xl">
                    check_circle
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 font-[family-name:var(--font-mono)]">
                  SUCCESS
                </h3>
                <p className="text-emerald-400 font-medium mb-4 text-sm font-[family-name:var(--font-mono)]">
                  CREDENTIALS UPDATED
                </p>
                <p className="text-slate-500 text-xs font-[family-name:var(--font-mono)]">
                  Redirecting to secure gateway...
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* New Password Field */}
                <div className="group">
                  <label className="block text-[10px] text-slate-500 font-[family-name:var(--font-mono)] uppercase tracking-wider mb-2 ml-1">
                    New_Credential
                  </label>
                  <div className="relative transform transition-all duration-200 group-focus-within:scale-[1.02]">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                      <span className="material-symbols-outlined text-lg">
                        vpn_key
                      </span>
                    </span>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      className="w-full px-12 py-3.5 bg-[#1a1d25]/50 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all font-[family-name:var(--font-mono)] text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showNewPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Entropy Score */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-slate-500 font-[family-name:var(--font-mono)] uppercase tracking-wider">
                      Entropy Score
                    </span>
                    <span
                      className="text-xs font-bold font-[family-name:var(--font-mono)]"
                      style={{ color: strengthInfo.color }}
                    >
                      {Math.round(entropy)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#1a1d25] rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${strengthInfo.percentage}%`,
                        backgroundColor: strengthInfo.color,
                      }}
                      transition={{ duration: 0.3 }}
                      className="h-full rounded-full"
                    />
                  </div>
                  {newPassword && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: strengthInfo.color }}
                      />
                      <span
                        className="text-[10px] uppercase tracking-wider font-bold"
                        style={{ color: strengthInfo.color }}
                      >
                        {strengthInfo.label}
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="group">
                  <label className="block text-[10px] text-slate-500 font-[family-name:var(--font-mono)] uppercase tracking-wider mb-2 ml-1">
                    Confirm_Credential
                  </label>
                  <div className="relative transform transition-all duration-200 group-focus-within:scale-[1.02]">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                      <span className="material-symbols-outlined text-lg">
                        lock
                      </span>
                    </span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type password"
                      required
                      className="w-full px-12 py-3.5 bg-[#1a1d25]/50 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all font-[family-name:var(--font-mono)] text-sm"
                    />
                  </div>
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
                  disabled={resetMutation.isPending}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-500/90 hover:to-teal-600/90 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-[family-name:var(--font-mono)] text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  {resetMutation.isPending ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-lg">
                        progress_activity
                      </span>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg group-hover:rotate-180 transition-transform duration-500">
                        sync
                      </span>
                      <span>Update Credentials</span>
                    </>
                  )}
                </button>

                {/* Back Link */}
                <div className="text-center pt-2">
                  <Link
                    href="/admin/login"
                    className="text-slate-500 hover:text-slate-300 text-xs transition-colors inline-flex items-center gap-2 font-[family-name:var(--font-mono)] group"
                  >
                    <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">
                      arrow_back
                    </span>
                    RETURN_TO_VAULT
                  </Link>
                </div>
              </form>
            )}
          </motion.div>

          {/* Decorative Line */}
          <div className="mt-8 flex justify-center opacity-30">
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between px-6 py-4 border-t border-white/5 text-xs text-slate-600">
        <span>© 2024 Backend Infrastructure. Encrypted Session.</span>
        <div className="flex items-center gap-6">
          <Link href="#" className="hover:text-slate-400 transition-colors">
            API Health
          </Link>
          <Link href="#" className="hover:text-slate-400 transition-colors">
            Audit Logs
          </Link>
        </div>
      </footer>
    </div>
  );
}
