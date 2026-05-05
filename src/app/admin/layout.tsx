"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  AdminAuthProvider,
  useAdminAuth,
} from "@/providers/admin-auth-provider";

const sidebarItems = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Hero", href: "/admin/hero", icon: "home" },
  { label: "Projects", href: "/admin/projects", icon: "folder" },
  { label: "Skills", href: "/admin/skills", icon: "code" },
  { label: "Blog", href: "/admin/blog", icon: "article" },
  { label: "Chat", href: "/admin/chat", icon: "chat" },
  { label: "About", href: "/admin/about", icon: "info" },
  {
    label: "Email Templates",
    href: "/admin/email-templates",
    icon: "mark_email_read",
  },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
];

// Routes that don't need the sidebar layout
const NO_LAYOUT_ROUTES = [
  "/admin/login",
  "/admin/verify-2fa",
  "/admin/reset-password",
  "/admin/recover",
  "/admin/settings/2fa",
  "/admin/unauthorized",
];

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout } = useAdminAuth();

  // Skip layout for auth pages
  if (NO_LAYOUT_ROUTES.some((route) => pathname === route)) {
    return <>{children}</>;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">
            progress_activity
          </span>
          <p className="text-slate-400 font-[family-name:var(--font-mono)]">
            Verifying session...
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated and not on auth page, the provider will redirect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-4xl text-red-500">
            gpp_bad
          </span>
          <p className="text-slate-400 font-[family-name:var(--font-mono)]">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-obsidian">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-card-dark border-r border-white/5">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
          <div className="size-10 flex items-center justify-center bg-primary/10 rounded-lg text-primary">
            <span className="material-symbols-outlined">terminal</span>
          </div>
          <div>
            <h2 className="text-white font-bold font-[family-name:var(--font-mono)]">
              DEV_IO
            </h2>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              Admin Panel
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <span className="material-symbols-outlined text-xl">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">
              arrow_back
            </span>
            View Site
          </Link>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors w-full"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-card-dark/80 backdrop-blur-md border-b border-white/5">
          <h1 className="text-xl font-bold text-white">
            {sidebarItems.find(
              (item) =>
                pathname === item.href ||
                (item.href !== "/admin" && pathname?.startsWith(item.href)),
            )?.label || "Dashboard"}
          </h1>

          <div className="flex items-center gap-4">
            {/* Online Status Toggle */}
            <OnlineToggle />

            {/* User */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">
                {user?.name || user?.email}
              </span>
              <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-lg">
                  person
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

function OnlineToggle() {
  const [isOnline, setIsOnline] = useState(false);

  // Ideally, fetch initial state here
  // For now, toggle optimistically

  return (
    <button
      onClick={async () => {
        setIsOnline(!isOnline);
        const token = localStorage.getItem("admin-token");
        await fetch("/api/admin/profile/presence", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors border ${isOnline ? "bg-white/5 hover:bg-white/10 border-white/10" : "bg-red-500/10 hover:bg-red-500/20 border-red-500/20"}`}
      title="Toggle Online Status for Chat Offline Auto-Replies"
    >
      <span
        className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
      />
      <span
        className={`text-xs font-medium ${isOnline ? "text-white" : "text-red-400"}`}
      >
        {isOnline ? "Online" : "Offline"}
      </span>
    </button>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  );
}
