"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FormEvent,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettings } from "@/hooks/queries/use-settings";
import { useSocialLinks } from "@/hooks/queries/use-social-links";
import { useProjects } from "@/hooks/queries/use-projects";
import { useBlogPosts } from "@/hooks/queries/use-blog";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

// ── Helper: Map Brand to Material Symbol ──────

const iconMap: Record<string, string> = {
  github: "code",
  git: "code",
  linkedin: "work",
  linked: "work",
  twitter: "tag",
  x: "tag",
  email: "alternate_email",
  mail: "alternate_email",
  gmail: "alternate_email",
  facebook: "thumb_up",
  instagram: "photo_camera",
  youtube: "play_circle",
  resume: "description",
  cv: "description",
};

function getSocialIcon(icon: string, platform: string): string {
  const pKey = platform.toLowerCase().trim();
  const iKey = (icon || "").toLowerCase().trim();
  return iconMap[pKey] || iconMap[iKey] || iKey || "link";
}

// ── Navigation Data ──────────────────────────

const quickLinks = [
  { label: "Projects", href: "/projects", icon: "deployed_code" },
  { label: "Tech Stack", href: "/skills", icon: "memory" },
  { label: "Insights", href: "/blog", icon: "article" },
  { label: "About", href: "/about", icon: "person" },
];

const resourceLinks = [
  { label: "Contact", href: "/about#contact", icon: "mail" },
  { label: "Newsletter", href: "/blog#subscribe", icon: "campaign" },
];

// ── Tech Marquee Data ────────────────────────

const techItems = [
  "TypeScript",
  "Node.js",
  "Next.js",
  "React",
  "MongoDB",
  "Redis",
  "Docker",
  "AWS",
  "GraphQL",
  "PostgreSQL",
  "Kubernetes",
  "Terraform",
  "CI/CD",
  "REST APIs",
  "WebSocket",
];

// ── Newsletter Subscribe Hook ───────────────

function useNewsletterSubscribe() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const subscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || state === "loading") return;
    setState("loading");
    try {
      await apiClient.post("/newsletter/subscribe", { email });
      setState("success");
      setMessage("Subscribed!");
      setEmail("");
      setTimeout(() => setState("idle"), 4000);
    } catch {
      setState("error");
      setMessage("Already subscribed or invalid email.");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  return { email, setEmail, state, message, subscribe };
}

// ── Live Clock Hook ─────────────────────────

function useLiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZoneName: "short",
        }),
      );
    };
    update();
    const id = setInterval(update, 1_000);
    return () => clearInterval(id);
  }, []);

  return time;
}

// ── Scroll Progress + Scroll-to-Top ─────────

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    setProgress(
      docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0,
    );
    setIsVisible(scrollTop > 400);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Keyboard shortcut: press T to scroll to top (when not in input)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "t" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        scrollToTop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scrollToTop]);

  return { progress, isVisible, scrollToTop };
}

// ── Live Status Ping ────────────────────────

function useSystemStatus() {
  const [status, setStatus] = useState<{
    online: boolean;
    latency: number | null;
  }>({ online: true, latency: null });

  useEffect(() => {
    const ping = async () => {
      const start = performance.now();
      try {
        await fetch("/api/health", { method: "GET" });
        setStatus({
          online: true,
          latency: Math.round(performance.now() - start),
        });
      } catch {
        setStatus((prev) => ({ ...prev, online: false }));
      }
    };
    ping();
    const interval = setInterval(ping, 30_000);
    return () => clearInterval(interval);
  }, []);

  return status;
}

// ── Intersection Observer for Fade-In ───────

function useFooterVisible() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

// ── Footer Component ─────────────────────────

export function Footer() {
  const pathname = usePathname();
  const { data: settings } = useSettings();
  const { data: socialLinksData = [] } = useSocialLinks();
  const { data: projects = [] } = useProjects({ limit: 100 });
  const { data: posts = [] } = useBlogPosts({ limit: 100 });
  const {
    progress,
    isVisible: showScrollTop,
    scrollToTop,
  } = useScrollProgress();
  const systemStatus = useSystemStatus();
  const { ref: footerRef, visible: footerVisible } = useFooterVisible();
  const newsletter = useNewsletterSubscribe();
  const liveClock = useLiveClock();
  const [currentYear] = useState(() => new Date().getFullYear());

  const siteName = settings?.siteName || "SURESH";
  const siteTagline = settings?.siteTagline || "Backend Developer Portfolio";
  const statusText = settings?.statusText || "OPERATIONAL";
  const socialLinks = socialLinksData.filter((l) => l.isVisible !== false);

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/" && pathname?.startsWith(href.split("#")[0]));

  return (
    <>
      <footer
        ref={footerRef}
        className="relative w-full z-30 overflow-hidden"
        id="site-footer"
      >
        {/* ── Animated Top Border ── */}
        <div className="absolute top-0 left-0 w-full h-px">
          <div className="footer-gradient-border" />
        </div>

        {/* ── Background Effects ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-[10%] w-72 h-72 sm:w-96 sm:h-96 bg-primary/[0.03] rounded-full blur-[120px]" />
          <div className="absolute -top-24 right-[15%] w-56 h-56 sm:w-72 sm:h-72 bg-secondary/[0.03] rounded-full blur-[100px]" />
        </div>

        {/* ── CTA Banner ── */}
        <div className="relative bg-[#020203]/80 backdrop-blur-sm">
          <div
            className={cn(
              "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-10 sm:pb-14",
              "transition-all duration-700",
              footerVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8",
            )}
          >
            {/* CTA Section */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden mb-12 sm:mb-16 group">
              {/* CTA Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-secondary/[0.06]" />
              <div className="absolute inset-0 bg-white/[0.01] backdrop-blur-sm" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-2xl sm:rounded-3xl" />

              {/* CTA Glow on hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl -z-10" />

              <div className="relative px-6 py-10 sm:px-10 sm:py-14 lg:px-16 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                {/* CTA Icon */}
                <div className="shrink-0 size-14 sm:size-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl sm:text-3xl text-primary">
                    rocket_launch
                  </span>
                </div>

                {/* CTA Text */}
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 tracking-tight">
                    Let&apos;s Build Something Extraordinary
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-md mb-4 sm:mb-0">
                    Got an idea or project in mind? I&apos;m always open to
                    discussing new opportunities and challenges.
                  </p>

                  {/* Newsletter Subscribe - inline on desktop */}
                  <form
                    onSubmit={newsletter.subscribe}
                    className="flex sm:hidden flex-col gap-2 mt-3 w-full max-w-sm"
                  >
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={newsletter.email}
                        onChange={(e) => newsletter.setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="flex-1 min-w-0 px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-primary/40 transition-colors font-[family-name:var(--font-mono)]"
                        required
                      />
                      <button
                        type="submit"
                        disabled={newsletter.state === "loading"}
                        className="shrink-0 px-4 py-2.5 rounded-lg bg-primary/15 border border-primary/25 text-primary text-sm font-semibold hover:bg-primary hover:text-black transition-all disabled:opacity-50"
                      >
                        {newsletter.state === "loading" ? "..." : "Subscribe"}
                      </button>
                    </div>
                    {newsletter.state !== "idle" &&
                      newsletter.state !== "loading" && (
                        <p
                          className={cn(
                            "text-[11px] font-[family-name:var(--font-mono)]",
                            newsletter.state === "success"
                              ? "text-emerald-400"
                              : "text-red-400",
                          )}
                        >
                          {newsletter.message}
                        </p>
                      )}
                  </form>
                </div>

                {/* Right side: Subscribe + CTA (desktop) */}
                <div className="shrink-0 flex flex-col gap-3 items-center sm:items-end">
                  {/* Desktop newsletter */}
                  <form
                    onSubmit={newsletter.subscribe}
                    className="hidden sm:flex items-center gap-2"
                  >
                    <input
                      type="email"
                      value={newsletter.email}
                      onChange={(e) => newsletter.setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-44 lg:w-52 px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-primary/40 transition-colors font-[family-name:var(--font-mono)]"
                      required
                    />
                    <button
                      type="submit"
                      disabled={newsletter.state === "loading"}
                      className="shrink-0 px-4 py-2.5 rounded-lg bg-primary/15 border border-primary/25 text-primary text-sm font-semibold hover:bg-primary hover:text-black transition-all disabled:opacity-50"
                    >
                      {newsletter.state === "loading" ? "..." : "Subscribe"}
                    </button>
                  </form>
                  {newsletter.state !== "idle" &&
                    newsletter.state !== "loading" && (
                      <p
                        className={cn(
                          "hidden sm:block text-[11px] font-[family-name:var(--font-mono)]",
                          newsletter.state === "success"
                            ? "text-emerald-400"
                            : "text-red-400",
                        )}
                      >
                        {newsletter.message}
                      </p>
                    )}

                  {/* Contact CTA */}
                  <Link
                    href="/about#contact"
                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold text-sm hover:bg-primary hover:text-black hover:shadow-[0_0_30px_rgba(0,242,255,0.3)] hover:border-primary transition-all duration-400 group/btn"
                  >
                    <span className="material-symbols-outlined text-lg">
                      mail
                    </span>
                    Get in Touch
                    <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-0.5">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Grid Content ── */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-12 gap-8 sm:gap-10 md:gap-8">
              {/* ── Brand Column ── */}
              <div
                className={cn(
                  "col-span-2 sm:col-span-2 md:col-span-5",
                  "transition-all duration-700 delay-100",
                  footerVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6",
                )}
              >
                {/* Logo */}
                <Link
                  href="/"
                  className="group inline-flex items-center gap-3 w-fit mb-5"
                >
                  <div className="size-10 sm:size-11 flex items-center justify-center bg-black/60 rounded-xl text-primary font-bold border border-white/5 group-hover:border-primary/40 group-hover:shadow-[0_0_20px_rgba(0,242,255,0.2)] transition-all duration-500">
                    <span className="material-symbols-outlined text-lg sm:text-xl">
                      terminal
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold tracking-tight font-[family-name:var(--font-mono)] text-base sm:text-lg">
                      {siteName}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 font-[family-name:var(--font-mono)] uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                      {siteTagline}
                    </span>
                  </div>
                </Link>

                {/* Description */}
                <p className="text-[13px] sm:text-sm text-slate-400 leading-relaxed max-w-sm mb-5">
                  Crafting high-performance distributed systems and resilient
                  microservices. Building the backbone of modern digital
                  infrastructure.
                </p>

                {/* Site Stats */}
                <div className="flex items-center gap-4 mb-5">
                  {[
                    {
                      label: "Projects",
                      value: projects.length,
                      icon: "deployed_code",
                    },
                    { label: "Articles", value: posts.length, icon: "article" },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary/60 text-sm">
                        {stat.icon}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm font-[family-name:var(--font-mono)] leading-none">
                          {stat.value}
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider">
                          {stat.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* System Status Card */}
                <div className="inline-flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="relative flex size-2">
                      <span
                        className={cn(
                          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                          systemStatus.online ? "bg-emerald-400" : "bg-red-400",
                        )}
                      />
                      <span
                        className={cn(
                          "relative inline-flex rounded-full size-2",
                          systemStatus.online ? "bg-emerald-500" : "bg-red-500",
                        )}
                      />
                    </span>
                    <span
                      className={cn(
                        "text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.12em] sm:tracking-[0.15em] font-[family-name:var(--font-mono)]",
                        systemStatus.online
                          ? "text-emerald-400"
                          : "text-red-400",
                      )}
                    >
                      {systemStatus.online ? statusText : "OFFLINE"}
                    </span>
                  </div>
                  <div className="w-px h-3 bg-white/10" />
                  <span className="text-[9px] sm:text-[10px] text-slate-500 font-[family-name:var(--font-mono)]">
                    {systemStatus.latency !== null
                      ? `${systemStatus.latency}ms`
                      : "--ms"}
                  </span>
                </div>
              </div>

              {/* ── Navigation Column ── */}
              <div
                className={cn(
                  "col-span-1 md:col-span-3",
                  "transition-all duration-700 delay-200",
                  footerVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6",
                )}
              >
                <h3 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 font-[family-name:var(--font-mono)] mb-4 sm:mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">
                    navigation
                  </span>
                  Navigate
                </h3>
                <nav className="flex flex-col gap-0.5">
                  {quickLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all duration-300 text-[13px] sm:text-sm",
                        isActive(item.href)
                          ? "bg-primary/10 text-white"
                          : "text-slate-400 hover:text-white hover:bg-white/[0.03]",
                      )}
                    >
                      <span
                        className={cn(
                          "material-symbols-outlined text-sm sm:text-base transition-colors shrink-0",
                          isActive(item.href)
                            ? "text-primary"
                            : "text-slate-600 group-hover:text-primary",
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                      {isActive(item.href) && (
                        <span className="ml-auto relative flex h-1.5 w-1.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                        </span>
                      )}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* ── Resources & Social Column ── */}
              <div
                className={cn(
                  "col-span-1 md:col-span-4",
                  "transition-all duration-700 delay-300",
                  footerVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6",
                )}
              >
                <h3 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 font-[family-name:var(--font-mono)] mb-4 sm:mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">
                    hub
                  </span>
                  Connect
                </h3>

                {/* Resource Links */}
                <div className="flex flex-col gap-0.5 mb-5 sm:mb-6">
                  {resourceLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all duration-300 text-[13px] sm:text-sm"
                    >
                      <span className="material-symbols-outlined text-sm sm:text-base text-slate-600 group-hover:text-primary transition-colors shrink-0">
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                      <span className="material-symbols-outlined text-xs ml-auto opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0 transition-all shrink-0 hidden sm:inline">
                        arrow_forward
                      </span>
                    </Link>
                  ))}

                  {/* Resume Link */}
                  {settings?.resumeUrl && (
                    <Link
                      href={`https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(settings.resumeUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all duration-300 text-[13px] sm:text-sm"
                    >
                      <span className="material-symbols-outlined text-sm sm:text-base text-slate-600 group-hover:text-primary transition-colors shrink-0">
                        description
                      </span>
                      <span className="truncate">Resume</span>
                      <span className="material-symbols-outlined text-xs ml-auto opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0 transition-all shrink-0 hidden sm:inline">
                        open_in_new
                      </span>
                    </Link>
                  )}
                </div>

                {/* Social Icons Grid */}
                {socialLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map((link, i) => (
                      <Link
                        key={link._id ?? link.platform}
                        href={link.url}
                        target={
                          link.url.startsWith("http") ? "_blank" : undefined
                        }
                        rel={
                          link.url.startsWith("http")
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className={cn(
                          "footer-social-icon group relative size-10 sm:size-11 rounded-xl flex items-center justify-center transition-all duration-300",
                          "bg-white/[0.02] border border-white/[0.06]",
                          "text-slate-400 hover:text-white",
                          "hover:bg-primary/10 hover:border-primary/25 hover:shadow-[0_0_16px_rgba(0,242,255,0.12)] hover:-translate-y-0.5",
                        )}
                        style={{
                          transitionDelay: footerVisible
                            ? `${350 + i * 60}ms`
                            : "0ms",
                        }}
                        aria-label={link.platform}
                      >
                        <span className="material-symbols-outlined text-lg group-hover:text-primary transition-colors">
                          {getSocialIcon(link.icon, link.platform)}
                        </span>
                        {/* Tooltip - hidden on mobile */}
                        <span className="hidden sm:block absolute -top-10 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform origin-bottom bg-black/90 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-lg border border-white/10 whitespace-nowrap font-[family-name:var(--font-mono)] shadow-xl">
                          {link.platform}
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45 border-r border-b border-white/10" />
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Tech Marquee ── */}
          <div className="relative overflow-hidden py-5 border-t border-b border-white/[0.04]">
            <div className="footer-marquee flex gap-8 whitespace-nowrap">
              {[...techItems, ...techItems].map((tech, i) => (
                <span
                  key={`${tech}-${i}`}
                  className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 font-[family-name:var(--font-mono)] uppercase tracking-wider shrink-0"
                >
                  <span className="text-primary/40">◆</span>
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          </div>

          {/* ── Bottom Bar ── */}
          <div
            className={cn(
              "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6",
              "transition-all duration-700 delay-[400ms]",
              footerVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4",
            )}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              {/* Copyright */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500 font-[family-name:var(--font-mono)] flex-wrap justify-center">
                <span className="material-symbols-outlined text-xs sm:text-sm text-slate-600">
                  copyright
                </span>
                <span>
                  {currentYear} {siteName}.
                </span>
                <span className="text-slate-700 hidden xs:inline">|</span>
                <span className="hidden xs:inline">All rights reserved.</span>
              </div>

              {/* Tech & Version Stack */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
                {/* Tech Badge */}
                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] text-slate-500 font-[family-name:var(--font-mono)] bg-white/[0.02] border border-white/5 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5">
                  <span className="material-symbols-outlined text-[10px] sm:text-xs text-primary/60">
                    code
                  </span>
                  <span>Next.js</span>
                  <span className="text-slate-700">•</span>
                  <span>React</span>
                  <span className="text-slate-700">•</span>
                  <span>MongoDB</span>
                </div>

                {/* Made with love */}
                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-600 font-[family-name:var(--font-mono)]">
                  <span>Crafted with</span>
                  <span className="footer-heart text-red-400 text-xs">♥</span>
                  <span className="hidden xs:inline">& TypeScript</span>
                </div>

                {/* Live Clock */}
                {liveClock && (
                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-600 font-[family-name:var(--font-mono)] bg-white/[0.02] border border-white/5 rounded-full px-2.5 py-1">
                    <span className="material-symbols-outlined text-[10px] text-primary/50">
                      schedule
                    </span>
                    <span className="tabular-nums">{liveClock}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Scroll-to-Top Button (outside footer for fixed positioning) ── */}
      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 size-12 sm:size-11 rounded-xl flex items-center justify-center transition-all duration-500",
          "bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl",
          "hover:bg-primary/20 hover:border-primary/30 hover:shadow-[0_0_24px_rgba(0,242,255,0.2)]",
          "text-slate-400 hover:text-primary",
          "active:scale-95",
          showScrollTop
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-4 opacity-0 scale-90 pointer-events-none",
        )}
        aria-label="Scroll to top"
      >
        {/* Progress Ring */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 44 44"
        >
          <circle
            cx="22"
            cy="22"
            r="19"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="2"
          />
          <circle
            cx="22"
            cy="22"
            r="19"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 19}`}
            strokeDashoffset={`${2 * Math.PI * 19 * (1 - progress / 100)}`}
            className="transition-[stroke-dashoffset] duration-150 ease-out"
            opacity="0.6"
          />
        </svg>
        <span className="material-symbols-outlined text-lg relative z-10">
          keyboard_arrow_up
        </span>
      </button>
    </>
  );
}
