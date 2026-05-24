import Link from "next/link";
import { settingsService } from "@/server/services/settings.service";
import { socialLinksService } from "@/server/services/social-links.service";
import { LatencyStatus } from "./latency-status";

// ── Helper: Map Brand to Material Symbol ──────

const getValidIcon = (iconStr: string) => {
  const i = iconStr.toLowerCase().trim();
  if (i === "github" || i === "git") return "code";
  if (i === "linkedin" || i === "linked") return "link";
  if (i === "twitter" || i === "x") return "tag";
  if (i === "email" || i === "mail" || i === "gmail") return "mail";
  if (i === "facebook" || i === "fb") return "thumb_up";
  if (i === "instagram" || i === "ig") return "photo_camera";
  if (i === "youtube" || i === "yt") return "play_circle";
  return i;
};

// ── Footer Component ─────────────────────────

export async function Footer() {
  // Fetch data statically at build time (or ISR)
  const [settingsRes, socialLinksRes] = await Promise.all([
    settingsService.getPublic(),
    socialLinksService.getAll(),
  ]);

  const settings: Record<string, unknown> = settingsRes.success
    ? (settingsRes.data as Record<string, unknown>)
    : {};
  const socialLinks: Record<string, unknown>[] =
    socialLinksRes.success && Array.isArray(socialLinksRes.data)
      ? socialLinksRes.data
      : [];

  const siteName = settings?.siteName || "SURESH";
  const statusText = settings?.statusText || "OPERATIONAL";

  return (
    <footer className="w-full border-t border-white/5 bg-[#020203] px-4 sm:px-6 py-8 sm:py-12 relative z-30">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
        {/* Logo & Status */}
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-2 text-white font-bold font-[family-name:var(--font-mono)]">
            <span className="material-symbols-outlined text-primary">
              terminal
            </span>
            <span>{siteName}</span>
          </div>
          <div className="text-slate-600 text-xs font-[family-name:var(--font-mono)] space-y-0.5">
            <LatencyStatus statusText={statusText} />
            <p>© {new Date().getFullYear()}</p>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex gap-6">
          {socialLinks
            .filter((l) => l.isVisible !== false)
            .map((link) => (
              <Link
                key={link.platform || link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="size-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary/20 hover:scale-110 transition-all"
                aria-label={link.platform}
              >
                <span className="material-symbols-outlined text-xl truncate overflow-hidden">
                  {getValidIcon(link.icon || "")}
                </span>
              </Link>
            ))}
        </div>
      </div>
    </footer>
  );
}
