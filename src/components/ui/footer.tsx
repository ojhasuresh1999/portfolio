import Link from "next/link";

const socialLinks = [
  { icon: "code", href: "https://github.com", label: "GitHub" },
  { icon: "alternate_email", href: "mailto:hello@example.com", label: "Email" },
  { icon: "link", href: "https://linkedin.com", label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-[#020203] px-6 py-12 relative z-30">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Logo & Status */}
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-2 text-white font-bold font-[family-name:var(--font-mono)]">
            <span className="material-symbols-outlined text-primary">
              terminal
            </span>
            <span>
              DEV<span className="text-primary">_</span>IO
            </span>
          </div>
          <p className="text-slate-600 text-xs font-[family-name:var(--font-mono)]">
            STATUS: OPERATIONAL
            <br />
            LATENCY: 12ms
            <br />© {new Date().getFullYear()}
          </p>
        </div>

        {/* Social Links */}
        <div className="flex gap-6">
          {socialLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="size-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary/20 hover:scale-110 transition-all"
              aria-label={link.label}
            >
              <span className="material-symbols-outlined text-xl">
                {link.icon}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
