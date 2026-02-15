"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// =============================================================================
// 2FA Verification Page
// Design: SECURITY VERIFICATION - No top navbar per user feedback
// =============================================================================

interface ApiError {
  error?: string;
}

export default function Verify2FAPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(114); // 1:54 as shown in design
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // Ref to prevent multiple submissions — survives across renders and
  // React Strict Mode double-mounts in development
  const isSubmittingRef = useRef(false);
  // Track if auto-submit has already run for the current code
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    // Get 2FA data from session storage
    const storedRequestId = sessionStorage.getItem("2fa-requestId");
    const storedToken = sessionStorage.getItem("2fa-token");

    if (!storedRequestId || !storedToken) {
      // Only redirect if we haven't already submitted (successful verify clears storage)
      if (!isSubmittingRef.current) {
        router.push("/admin/login");
      }
      return;
    }

    // Countdown timer
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  // Submit code to API — reads tokens directly from sessionStorage
  const submitCode = (fullCode: string) => {
    if (isSubmittingRef.current) return;

    const twoFactorToken = sessionStorage.getItem("2fa-token");
    const requestId = sessionStorage.getItem("2fa-requestId");
    if (!twoFactorToken || !requestId) {
      setError("Session expired. Please login again.");
      setTimeout(() => router.push("/admin/login"), 2000);
      return;
    }

    isSubmittingRef.current = true;

    verifyMutation.mutate({
      code: fullCode,
      requestId,
      twoFactorToken,
    });
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (newCode.every((d) => d !== "") && !isSubmittingRef.current) {
      autoSubmittedRef.current = true;
      submitCode(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || "";
    }
    setCode(newCode);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();

    // Auto-submit pasted complete code
    if (newCode.every((d) => d !== "") && !isSubmittingRef.current) {
      autoSubmittedRef.current = true;
      submitCode(newCode.join(""));
    }
  };

  const verifyMutation = useMutation({
    mutationFn: async (data: {
      code: string;
      requestId: string;
      twoFactorToken: string;
    }) => {
      const response = await apiClient.post("/admin/auth/verify-2fa", data);
      return response.data;
    },
    onSuccess: (data) => {
      // Clear 2FA session data
      sessionStorage.removeItem("2fa-token");
      sessionStorage.removeItem("2fa-requestId");

      // Store tokens
      localStorage.setItem("admin-token", data.accessToken);
      localStorage.setItem("admin-refresh-token", data.refreshToken);

      // If 2FA not set up (shouldn't happen here, but safety check), redirect to setup page
      if (!data.user?.twoFactorEnabled) {
        router.push("/admin/settings/2fa");
        return;
      }

      // Redirect to admin dashboard
      router.push("/admin");
    },
    onError: (err: ApiError) => {
      // Allow resubmission on error
      isSubmittingRef.current = false;
      autoSubmittedRef.current = false;
      setError(err.error || "Verification failed");
    },
  });

  const handleSubmit = () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    setError("");
    submitCode(fullCode);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setResendTimer(120);
    // TODO: Call resend API endpoint
  };

  return (
    <div className="min-h-screen bg-[#020204] flex flex-col font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[30%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[20%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] text-primary font-[family-name:var(--font-mono)] uppercase tracking-wider">
            Secure Channel Established
          </span>
        </motion.div>

        {/* Verification Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-lg bg-[#0c0e14]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Top Highlight Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          {/* Icon & Title */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6 border border-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <span className="material-symbols-outlined text-4xl text-primary">
                shield_lock
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-mono)] tracking-tight">
              2FA VERIFICATION
            </h1>
            <p className="text-slate-400 text-xs mt-2 font-[family-name:var(--font-mono)]">
              ENTER AUTHENTICATION CODE
            </p>
          </div>

          {/* Instruction */}
          <p className="text-center text-slate-400 mb-8 text-sm max-w-xs mx-auto">
            We sent a code to your registered device. Enter it below to verify
            your identity.
          </p>

          {/* OTP Inputs */}
          <div
            className="flex justify-center gap-2 md:gap-3 mb-8"
            onPaste={handlePaste}
          >
            {code.map((digit, index) => (
              <motion.input
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-10 h-14 md:w-14 md:h-16 text-center text-2xl font-bold bg-[#1a1d25]/50 border border-white/10 rounded-xl text-white focus:border-primary focus:ring-1 focus:ring-primary focus:bg-primary/5 outline-none transition-all font-[family-name:var(--font-mono)]"
              />
            ))}
          </div>

          {/* Request ID & Resend */}
          <div className="flex items-center justify-between text-[10px] md:text-xs mb-8 px-2">
            <span className="text-slate-500 font-[family-name:var(--font-mono)] tracking-wider">
              ID: {sessionStorage.getItem("2fa-requestId") || "AUTH_0921_X"}
            </span>
            <button
              onClick={handleResend}
              disabled={resendTimer > 0}
              className={`flex items-center gap-2 ${
                resendTimer > 0
                  ? "text-slate-500 cursor-not-allowed"
                  : "text-primary hover:text-primary/80 cursor-pointer"
              } transition-colors font-[family-name:var(--font-mono)] uppercase tracking-wider`}
            >
              <span className="material-symbols-outlined text-base">
                refresh
              </span>
              {resendTimer > 0
                ? `Resend (${formatTime(resendTimer)})`
                : "Resend Code"}
            </button>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6"
              >
                <span className="material-symbols-outlined text-base">
                  error
                </span>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verify Button */}
          <button
            onClick={handleSubmit}
            disabled={verifyMutation.isPending || code.some((d) => !d)}
            className="w-full py-4 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-[family-name:var(--font-mono)] text-sm uppercase tracking-wider shadow-lg shadow-primary/20 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            {verifyMutation.isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">
                  progress_activity
                </span>
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">
                  verified_user
                </span>
                <span>Verify Identity</span>
              </>
            )}
          </button>

          {/* Back Link */}
          <div className="text-center mt-6 pt-6 border-t border-white/5">
            <Link
              href="/admin/login"
              className="text-slate-500 hover:text-white text-xs transition-colors inline-flex items-center gap-2 font-[family-name:var(--font-mono)] uppercase tracking-wider group"
            >
              <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              Abort Verification
            </Link>
          </div>
        </motion.div>

        {/* Footer Info */}
        <div className="mt-8 flex flex-wrap justify-center gap-8 text-[10px] text-slate-600 font-[family-name:var(--font-mono)]">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
            <span>ENC: AES_256_GCM</span>
          </div>
          <span>NODE: ADMIN_CLSTR_01</span>
          <span>VER_TYPE: OTP_SMS</span>
        </div>
      </main>
    </div>
  );
}
