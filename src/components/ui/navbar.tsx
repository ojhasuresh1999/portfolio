"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/queries";

const navItems = [
  { label: "Projects", href: "/projects", icon: "deployed_code" },
  { label: "Stack", href: "/skills", icon: "memory" },
  { label: "Insights", href: "/blog", icon: "article" },
  { label: "About", href: "/about", icon: "person" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: settings } = useSettings();
  const siteName = settings?.siteName || "SURESH";
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close on escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    },
    [mobileOpen],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <>
      {/* ── Desktop & Mobile Top Bar ── */}
      <div className="fixed top-6 w-full z-50 px-4 flex justify-center">
        <header className="bg-glass-strong backdrop-blur-xl border border-white/5 rounded-full px-4 sm:px-6 py-3 flex items-center justify-between w-full max-w-5xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all hover:border-white/10">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="size-9 flex items-center justify-center bg-black/50 rounded-lg text-primary font-bold border border-white/5 group-hover:border-primary/50 group-hover:shadow-[0_0_15px_rgba(0,242,255,0.3)] transition-all duration-300">
              <span className="material-symbols-outlined text-lg">
                terminal
              </span>
            </div>
            <span className="text-white font-bold tracking-tight font-[family-name:var(--font-mono)] hidden sm:block">
              {siteName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-black/20 rounded-full p-1 border border-white/5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-1.5 text-xs font-medium rounded-full transition-all",
                  isActive(item.href)
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Status Indicator */}
            <div className="hidden xs:flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-3 py-1.5 shadow-[0_0_10px_rgba(0,242,255,0.1)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-[family-name:var(--font-mono)]">
                System Online
              </span>
            </div>

            {/* Contact Button - Desktop */}
            <Link
              href="/about#contact"
              className="hidden sm:flex items-center justify-center rounded-full size-9 bg-white/5 hover:bg-primary hover:text-black hover:shadow-[0_0_20px_rgba(0,242,255,0.6)] text-white transition-all border border-white/10"
            >
              <span className="material-symbols-outlined text-sm">mail</span>
            </Link>

            {/* Hamburger Button - Mobile Only */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex flex-col items-center justify-center size-9 rounded-full bg-white/5 border border-white/10 hover:border-primary/50 transition-all relative"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              <span
                className={cn(
                  "block h-[2px] w-4 bg-white rounded-full transition-all duration-300 absolute",
                  mobileOpen ? "rotate-45 translate-y-0" : "-translate-y-[5px]",
                )}
              />
              <span
                className={cn(
                  "block h-[2px] w-4 bg-white rounded-full transition-all duration-300 absolute",
                  mobileOpen ? "opacity-0 scale-0" : "opacity-100 scale-100",
                )}
              />
              <span
                className={cn(
                  "block h-[2px] w-4 bg-white rounded-full transition-all duration-300 absolute",
                  mobileOpen ? "-rotate-45 translate-y-0" : "translate-y-[5px]",
                )}
              />
            </button>
          </div>
        </header>
      </div>

      {/* ── Mobile Menu Overlay ── */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-all duration-500",
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-obsidian/95 backdrop-blur-2xl"
          onClick={() => setMobileOpen(false)}
        />

        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-secondary/5 rounded-full blur-[80px] animate-pulse" />
        </div>

        {/* Menu Content */}
        <div className="relative z-10 flex flex-col h-full pt-28 pb-8 px-8">
          {/* Navigation Links */}
          <nav className="flex-1 flex flex-col justify-center gap-2">
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center gap-4 px-6 py-5 rounded-2xl transition-all duration-300",
                  mobileOpen
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-8 opacity-0",
                  isActive(item.href)
                    ? "bg-primary/10 border border-primary/20 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white border border-transparent",
                )}
                style={{
                  transitionDelay: mobileOpen ? `${150 + index * 75}ms` : "0ms",
                }}
              >
                <span
                  className={cn(
                    "material-symbols-outlined text-2xl transition-colors",
                    isActive(item.href)
                      ? "text-primary"
                      : "text-slate-500 group-hover:text-primary",
                  )}
                >
                  {item.icon}
                </span>
                <div className="flex flex-col">
                  <span className="text-lg font-bold tracking-tight">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-[family-name:var(--font-mono)] text-slate-500 uppercase tracking-widest">
                    /{item.href.slice(1)}
                  </span>
                </div>
                {isActive(item.href) && (
                  <span className="ml-auto relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Bottom Section */}
          <div
            className={cn(
              "flex flex-col gap-4 transition-all duration-300",
              mobileOpen
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
            style={{ transitionDelay: mobileOpen ? "450ms" : "0ms" }}
          >
            {/* Status */}
            <div className="flex items-center justify-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-4 py-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-primary font-[family-name:var(--font-mono)]">
                System Online
              </span>
            </div>

            {/* Contact CTA */}
            <Link
              href="/about#contact"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-black font-bold hover:shadow-[0_0_30px_rgba(0,242,255,0.4)] transition-all text-sm"
            >
              <span className="material-symbols-outlined text-sm">mail</span>
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
