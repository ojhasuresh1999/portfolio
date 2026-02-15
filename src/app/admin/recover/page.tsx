"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// =============================================================================
// Recover Account Page
// Design: Cyber-security theme, Email + TOTP
// =============================================================================

export default function RecoverPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < 6; i++) newCode[i] = pasted[i] || "";
    setCode(newCode);
    const focusIndex = Math.min(pasted.length, 5);
    document.getElementById(`otp-${focusIndex}`)?.focus();
  };

  const recoverMutation = useMutation({
    mutationFn: async (data: { email: string; code: string }) => {
      const response = await apiClient.post("/admin/auth/recover", data);
      return response.data;
    },
    onSuccess: (data) => {
      // Redirect to reset password with token
      router.push(`/admin/reset-password?token=${data.resetToken}`);
    },
    onError: (err: { error?: string }) => {
      setError(err.error || "Recovery failed");
    },
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");

    if (step === "email" && !email) {
      setError("Please enter your email");
      return;
    }

    if (step === "email") {
      setStep("code");
      return;
    }

    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    recoverMutation.mutate({ email, code: fullCode });
  };

  return (
    <div className="min-h-screen bg-[#020204] flex flex-col font-sans overflow-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] left-[30%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#0c0e14]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <span className="material-symbols-outlined text-3xl text-primary">
                lock_open
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-mono)] tracking-tight">
              RECOVER ACCESS
            </h1>
            <p className="text-slate-400 text-xs mt-2 font-[family-name:var(--font-mono)]">
              AUTHENTICATOR VERIFICATION
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {step === "email" ? (
                <motion.div
                  key="email-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="group">
                    <label className="block text-[10px] text-slate-500 font-[family-name:var(--font-mono)] uppercase tracking-wider mb-2 ml-1">
                      Admin Email
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <span className="material-symbols-outlined text-lg">
                          mail
                        </span>
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="w-full pl-12 pr-4 py-3.5 bg-[#1a1d25]/50 border border-white/10 rounded-xl text-white outline-none focus:border-primary/50 transition-all font-[family-name:var(--font-mono)] text-sm"
                        autoFocus
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="code-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <p className="text-center text-slate-400 text-sm">
                    Enter the 6-digit code from your authenticator app
                  </p>
                  <div
                    className="flex justify-center gap-2"
                    onPaste={handlePaste}
                  >
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) =>
                          handleCodeChange(index, e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-10 h-12 md:w-12 md:h-14 text-center text-xl font-bold bg-[#1a1d25]/50 border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary focus:bg-primary/5 outline-none transition-all font-[family-name:var(--font-mono)]"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"
                >
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={recoverMutation.isPending}
              className="w-full py-4 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-[family-name:var(--font-mono)] text-sm uppercase tracking-wider shadow-lg shadow-primary/20 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              {recoverMutation.isPending ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">
                    progress_activity
                  </span>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>{step === "email" ? "CONTINUE" : "VERIFY CODE"}</span>
                  <span className="material-symbols-outlined text-lg">
                    arrow_forward
                  </span>
                </>
              )}
            </button>

            <div className="text-center pt-4 border-t border-white/5">
              <Link
                href="/admin/login"
                className="text-slate-500 hover:text-white text-xs transition-colors inline-flex items-center gap-2 font-[family-name:var(--font-mono)] uppercase tracking-wider group"
              >
                <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">
                  arrow_back
                </span>
                Return to Login
              </Link>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
