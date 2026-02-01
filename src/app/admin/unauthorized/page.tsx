"use client";

import Link from "next/link";

// =============================================================================
// Unauthorized Page
// Displayed when user tries to access admin without authentication
// =============================================================================

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#020204] flex flex-col">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 shimmer-bg opacity-50" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[150px]" />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        {/* Error Icon */}
        <div className="w-24 h-24 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-8">
          <span className="material-symbols-outlined text-red-500 text-5xl">
            gpp_bad
          </span>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold text-white mb-4 font-[family-name:var(--font-mono)]">
          ACCESS_DENIED
        </h1>
        <p className="text-slate-400 text-center max-w-md mb-8">
          Authentication required. You must be logged in to access the admin
          panel.
        </p>

        {/* Error Details */}
        <div className="bg-[#0c0e14]/90 backdrop-blur-xl border border-red-500/20 rounded-xl p-6 mb-8 max-w-md w-full">
          <div className="flex items-start gap-3 mb-4">
            <span className="material-symbols-outlined text-red-500 text-lg mt-0.5">
              error
            </span>
            <div>
              <p className="text-white font-medium mb-1">
                Unauthorized Request
              </p>
              <p className="text-slate-400 text-sm">
                Your session has expired or you do not have permission to view
                this resource.
              </p>
            </div>
          </div>
          <div className="border-t border-white/5 pt-4 mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-[family-name:var(--font-mono)]">
              <span>ERROR_CODE: 401</span>
              <span>STATUS: UNAUTHORIZED</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/admin/login"
            className="px-8 py-4 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">login</span>
            Initialize Session
          </Link>
          <Link
            href="/"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all border border-white/10 flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">home</span>
            Return to Site
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-center px-6 py-6 text-xs text-slate-600 font-[family-name:var(--font-mono)]">
        <span>
          © 2024 Backend Infrastructure Protocol • Security Protocol Active
        </span>
      </footer>
    </div>
  );
}
