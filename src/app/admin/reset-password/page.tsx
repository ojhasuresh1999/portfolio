"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const entropy = useMemo(() => calculateEntropy(newPassword), [newPassword]);
  const strengthInfo = useMemo(() => getStrengthInfo(entropy), [entropy]);

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsLoading(true);

    try {
      // Get token from URL if present (forgot password flow)
      const urlParams = new URLSearchParams(window.location.search);
      const resetToken = urlParams.get("token");

      const response = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("admin-token")
            ? { Authorization: `Bearer ${localStorage.getItem("admin-token")}` }
            : {}),
        },
        body: JSON.stringify({
          newPassword,
          confirmPassword,
          resetToken,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Password reset failed");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/login");
      }, 2000);
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
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {/* Background Effects */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 shimmer-bg opacity-50" />
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#3b82f6]/5 rounded-full blur-[100px]" />
        </div>

        {/* Reset Card */}
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-[#0c0e14]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Title */}
            <h1 className="text-3xl font-bold text-white mb-2 text-center">
              Secure Reset
            </h1>
            <p className="text-slate-400 text-sm mb-8 text-center">
              Backend developer panel credential update.
            </p>

            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#22c55e]/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#22c55e] text-3xl">
                    check_circle
                  </span>
                </div>
                <p className="text-[#22c55e] font-medium mb-2">
                  Password Updated Successfully
                </p>
                <p className="text-slate-400 text-sm">
                  Redirecting to login...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* New Password Field */}
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      className="w-full px-4 py-4 pr-12 bg-[#1a1d25] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showNewPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Entropy Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500 font-[family-name:var(--font-mono)] uppercase tracking-wider">
                      Entropy Score
                    </span>
                    <span
                      className="text-xs font-bold font-[family-name:var(--font-mono)]"
                      style={{ color: strengthInfo.color }}
                    >
                      {Math.round(entropy)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#1a1d25] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${strengthInfo.percentage}%`,
                        backgroundColor: strengthInfo.color,
                      }}
                    />
                  </div>
                  {newPassword && (
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: strengthInfo.color }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: strengthInfo.color }}
                      >
                        {strengthInfo.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type password"
                      required
                      className="w-full px-4 py-4 pr-12 bg-[#1a1d25] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/50 outline-none transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <span className="material-symbols-outlined text-lg">
                        lock
                      </span>
                    </span>
                  </div>
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
                  className="w-full py-4 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">
                        progress_activity
                      </span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">sync</span>
                      Update Credentials
                    </>
                  )}
                </button>

                {/* Back Link */}
                <div className="text-center">
                  <Link
                    href="/admin/login"
                    className="text-slate-500 hover:text-slate-300 text-sm transition-colors inline-flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">
                      arrow_back
                    </span>
                    Return to security vault
                  </Link>
                </div>
              </form>
            )}
          </div>

          {/* Decorative Line */}
          <div className="mt-8 flex justify-center">
            <div className="h-px w-64 bg-gradient-to-r from-transparent via-[#3b82f6]/50 to-transparent" />
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
