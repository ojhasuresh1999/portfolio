"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/queries";

const navItems = [
  { label: "Projects", href: "/projects" },
  { label: "Stack", href: "/skills" },
  { label: "Insights", href: "/blog" },
  { label: "About", href: "/about" },
  // { label: "Suresh", href: "/suresh" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: settings } = useSettings();
  const siteName = settings?.siteName || "SURESH";

  return (
    <div className="fixed top-6 w-full z-50 px-4 flex justify-center">
      <header className="bg-glass-strong backdrop-blur-xl border border-white/5 rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all hover:border-white/10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="size-9 flex items-center justify-center bg-black/50 rounded-lg text-primary font-bold border border-white/5 group-hover:border-primary/50 group-hover:shadow-[0_0_15px_rgba(0,242,255,0.3)] transition-all duration-300">
            <span className="material-symbols-outlined text-lg">terminal</span>
          </div>
          <span className="text-white font-bold tracking-tight font-[family-name:var(--font-mono)] hidden sm:block">
            {siteName}
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-black/20 rounded-full p-1 border border-white/5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-full transition-all",
                pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href))
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-3 py-1.5 shadow-[0_0_10px_rgba(0,242,255,0.1)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-[family-name:var(--font-mono)]">
              System Online
            </span>
          </div>

          {/* Contact Button */}
          <Link
            href="/about#contact"
            className="hidden sm:flex items-center justify-center rounded-full size-9 bg-white/5 hover:bg-primary hover:text-black hover:shadow-[0_0_20px_rgba(0,242,255,0.6)] text-white transition-all border border-white/10"
          >
            <span className="material-symbols-outlined text-sm">mail</span>
          </Link>
        </div>
      </header>
    </div>
  );
}
