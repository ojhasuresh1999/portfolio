import Link from "next/link";
import { TerminalWindow } from "@/components/animations/terminal-window";
import { NetworkVisualization } from "@/components/animations/network-visualization";

interface HeroSectionProps {
  title?: string;
  highlightWord?: string;
  description?: string;
  terminalCommand?: string;
}

export function HeroSection({
  title = "Architecting the Invisible Backbone.",
  highlightWord = "Invisible",
  description = "I build high-performance distributed systems and resilient microservices that power the next generation of digital experiences.",
  terminalCommand = "init backend_protocol --force",
}: HeroSectionProps) {
  // Split title to highlight the special word
  const parts = title.split(highlightWord);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-16 items-center min-h-[calc(100vh-120px)] sm:min-h-[500px] md:min-h-[700px]">
      {/* Left Content */}
      <div className="flex flex-col gap-5 md:gap-8 relative z-10 order-2 lg:order-1 mt-4 lg:mt-0">
        {/* Terminal */}
        <TerminalWindow command={terminalCommand} />

        {/* Main Title */}
        <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter mix-blend-lighten">
          {parts[0]}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary animate-pulse">
            {highlightWord}
          </span>
          {parts[1]}
        </h1>

        {/* Description */}
        <p className="text-slate-400 text-base md:text-lg max-w-lg leading-relaxed border-l-2 border-primary/50 pl-4 md:pl-6 bg-gradient-to-r from-primary/5 to-transparent py-2">
          {description}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-3 md:gap-5 mt-4 md:mt-6">
          <Link
            href="/about#contact"
            className="group relative flex items-center gap-2 sm:gap-3 px-5 sm:px-8 h-12 sm:h-14 rounded-full bg-white text-black font-bold text-sm sm:text-base transition-all hover:bg-primary hover:shadow-[0_0_40px_rgba(0,242,255,0.4)] overflow-hidden"
          >
            <span className="relative z-10">Initialize Project</span>
            <span className="material-symbols-outlined relative z-10 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
              arrow_outward
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]" />
          </Link>

          <Link
            href="https://github.com"
            target="_blank"
            className="flex items-center gap-2 sm:gap-3 px-5 sm:px-8 h-12 sm:h-14 rounded-full border border-white/20 text-white font-medium text-sm sm:text-base hover:bg-white/5 hover:border-white/40 transition-colors"
          >
            <span>View Source</span>
            <span className="material-symbols-outlined text-sm text-slate-400">
              code
            </span>
          </Link>
        </div>
      </div>

      {/* Right - Network Visualization */}
      <div className="order-1 lg:order-2">
        <NetworkVisualization />
      </div>
    </section>
  );
}
