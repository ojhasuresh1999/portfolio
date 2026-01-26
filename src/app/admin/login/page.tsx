"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Temporary mock login - replace with NextAuth
    if (email === "admin@example.com" && password === "admin123") {
      router.push("/admin");
    } else {
      setError("Invalid credentials");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center px-4">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none shimmer-bg" />
      <div className="fixed inset-0 z-0 pointer-events-none aurora-bg opacity-30" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="size-16 flex items-center justify-center bg-primary/10 rounded-2xl text-primary mb-4 border border-primary/20">
            <span className="material-symbols-outlined text-4xl">terminal</span>
          </div>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-mono)]">
            DEV<span className="text-primary">_</span>IO
          </h1>
          <p className="text-slate-500 text-sm mt-1">Admin Access Required</p>
        </div>

        {/* Login Form */}
        <div className="bg-card-dark border border-white/5 rounded-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-400 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                defaultValue="admin@example.com"
                className="w-full px-4 py-3 bg-obsidian border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="admin@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-400 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                defaultValue="admin123"
                className="w-full px-4 py-3 bg-obsidian border border-white/10 rounded-lg text-white placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  <span className="material-symbols-outlined">login</span>
                  Access System
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-primary font-[family-name:var(--font-mono)] mb-2">
              // Demo Credentials
            </p>
            <p className="text-xs text-slate-400">
              Email: admin@example.com
              <br />
              Password: admin123
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-slate-500 hover:text-primary text-sm transition-colors inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">
              arrow_back
            </span>
            Back to Site
          </Link>
        </div>
      </div>
    </div>
  );
}
