import Link from "next/link";
import { socialLinksService } from "@/server/services/social-links.service";

// Material Symbols icon map for social links
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

interface SocialLinkRecord {
  _id?: string;
  platform: string;
  url: string;
  icon: string;
  isVisible?: boolean;
  order?: number;
}

export async function FloatingSocialLinks() {
  const socialResult = await socialLinksService.getAll();

  const socialLinks = (
    socialResult.success
      ? (socialResult.data as unknown as SocialLinkRecord[])
      : []
  ).filter((l) => l.isVisible !== false);

  if (socialLinks.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl z-50 transition-all hover:scale-105 max-w-[90vw] overflow-x-auto no-scrollbar">
      {socialLinks.map((link) => (
        <Link
          key={link._id ?? link.platform}
          href={link.url}
          target={link.url.startsWith("http") ? "_blank" : undefined}
          rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
          className="group relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-800 hover:bg-primary hover:-translate-y-2 transition-all duration-300 shrink-0"
        >
          <span className="material-symbols-outlined text-2xl text-slate-200 group-hover:text-black">
            {getSocialIcon(link.icon, link.platform)}
          </span>
          <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {link.platform}
          </span>
        </Link>
      ))}
    </div>
  );
}
