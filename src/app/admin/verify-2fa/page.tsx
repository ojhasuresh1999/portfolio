"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// =============================================================================
// 2FA Verification Page
// Design: SECURITY VERIFICATION - No top navbar per user feedback
// =============================================================================

export default function Verify2FAPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState("");
  const [resendTimer, setResendTimer] = useState(114); // 1:54 as shown in design
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Get 2FA data from session storage
    const storedRequestId = sessionStorage.getItem("2fa-requestId");
    if (!storedRequestId) {
      router.push("/admin/login");
      return;
    }
    // Wrap in setTimeout to avoid synchronous state update warning
    setTimeout(() => {
      setRequestId(storedRequestId);
    }, 0);

    // Countdown timer
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
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
  };

  const handleSubmit = useCallback(async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    const twoFactorToken = sessionStorage.getItem("2fa-token");

    try {
      const response = await fetch("/api/admin/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: fullCode,
          requestId,
          twoFactorToken,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Verification failed");
        setIsLoading(false);
        return;
      }

      // Clear 2FA session data
      sessionStorage.removeItem("2fa-token");
      sessionStorage.removeItem("2fa-requestId");

      // Store tokens
      localStorage.setItem("admin-token", data.accessToken);
      localStorage.setItem("admin-refresh-token", data.refreshToken);

      // Redirect to admin dashboard
      router.push("/admin");
    } catch {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  }, [code, requestId, router]);

  // Auto-submit when all digits entered
  useEffect(() => {
    if (code.every((digit) => digit !== "")) {
      // Wrap in setTimeout to avoid synchronous state update warning
      setTimeout(() => {
        handleSubmit();
      }, 0);
    }
  }, [code, handleSubmit]);

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
    <div className="min-h-screen bg-[#020204] flex flex-col">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 shimmer-bg opacity-50" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#3b82f6]/10 rounded-full blur-[100px]" />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/30 mb-6">
          <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
          <span className="text-xs text-[#3b82f6] font-[family-name:var(--font-mono)] uppercase tracking-wider">
            Auth Protocol 0.2
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
          SECURITY VERIFICATION
        </h1>
        <p className="text-slate-400 text-center mb-12 max-w-md">
          Multi-factor authentication required for admin level access
        </p>

        {/* Verification Card */}
        <div className="w-full max-w-lg bg-[#0c0e14]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Shield Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-xl bg-[#3b82f6]/20 border border-[#3b82f6]/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#3b82f6] text-3xl">
                shield_lock
              </span>
            </div>
          </div>

          {/* Instruction */}
          <p className="text-center text-slate-400 mb-8">
            A verification code has been sent to your registered device.
          </p>

          {/* OTP Inputs */}
          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold bg-[#1a1d25] border border-white/10 rounded-xl text-white focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] outline-none transition-all"
              />
            ))}
          </div>

          {/* Request ID & Resend */}
          <div className="flex items-center justify-between text-sm mb-8">
            <span className="text-slate-500 font-[family-name:var(--font-mono)]">
              REQUEST_ID: {requestId || "AUTH_0921_X"}
            </span>
            <button
              onClick={handleResend}
              disabled={resendTimer > 0}
              className={`flex items-center gap-2 ${
                resendTimer > 0
                  ? "text-[#3b82f6]/50 cursor-not-allowed"
                  : "text-[#3b82f6] hover:text-[#60a5fa] cursor-pointer"
              } transition-colors font-[family-name:var(--font-mono)]`}
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              RESEND IN {formatTime(resendTimer)}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || code.some((d) => !d)}
            className="w-full py-4 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin">
                  progress_activity
                </span>
                Verifying...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">verified_user</span>
                Verify Identity
              </>
            )}
          </button>

          {/* Back Link */}
          <div className="text-center mt-6">
            <Link
              href="/admin/login"
              className="text-slate-500 hover:text-slate-300 text-sm transition-colors inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">
                arrow_back
              </span>
              Back to Authentication
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 flex flex-wrap justify-center gap-8 text-xs text-slate-600 font-[family-name:var(--font-mono)]">
          <span>ENC: AES_256_GCM</span>
          <span>NODE: ADMIN_CLSTR_01</span>
          <span>VER_TYPE: OTP_SMS</span>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="flex items-center justify-between px-6 py-4 border-t border-white/5 text-xs font-[family-name:var(--font-mono)]">
        <div className="flex items-center gap-2 text-[#22c55e]">
          <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
          ENCRYPTED LINK ACTIVE
        </div>
        <span className="text-slate-600">HASH: 7F28A...3D</span>
        <span className="text-slate-600">
          © 2024 DEV_PORTFOLIO, SECURITY PROTOCOL
        </span>
      </footer>
    </div>
  );
}
