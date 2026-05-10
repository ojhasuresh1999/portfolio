import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { aboutService } from "@/server/services/about.service";
import { settingsService } from "@/server/services/settings.service";
import { techStackService } from "@/server/services/tech-stack.service";
import { AboutContactForm } from "@/components/about/about-contact-form";
import { FloatingSocialLinks } from "@/components/ui/floating-social-links";

export default async function AboutPage() {
  const [aboutResult, timelineResult, settingsResult, techStackResult] =
    await Promise.all([
      aboutService.getAboutContent(),
      aboutService.getVisibleTimeline(),
      settingsService.getPublic(),
      techStackService.getAllTechStack(),
    ]);

  const aboutContent =
    aboutResult.success && aboutResult.data
      ? aboutResult.data
      : {
          title: "More Than Just Code",
          subtitle: "About Me",
          description:
            "I am a Senior Developer obsessed with system architecture.",
          resumeUrl: "",
        };

  const timelineEntries = timelineResult.success ? timelineResult.data : [];

  // Global CV URL from settings takes priority
  const settings = settingsResult.success
    ? (settingsResult.data as { resumeUrl?: string })
    : null;
  const resumeUrl = settings?.resumeUrl || aboutContent.resumeUrl || "";

  // Tech stack - only visible ones
  interface TechStackRecord {
    _id?: string;
    name: string;
    icon: string;
    color: string;
    isVisible?: boolean;
    order?: number;
  }
  const techStack = (
    techStackResult.success
      ? (techStackResult.data as unknown as TechStackRecord[])
      : []
  ).filter((t) => t.isVisible !== false);

  const centerNode = techStack.length > 0 ? techStack[0] : null;
  const orbitNodes = techStack.length > 1 ? techStack.slice(1) : [];

  // Helper to map non-material icon names to material symbols
  const getTechIcon = (icon: string, name: string) => {
    const key = (icon || name).toLowerCase().trim();
    const map: Record<string, string> = {
      zap: "bolt",
      box: "inventory_2",
      "share-2": "share",
      triangle: "change_history",
      js: "javascript",
      react: "data_object",
      "node.js": "hexagon",
      "next.js": "change_history",
    };
    return map[key] || key;
  };

  return (
    <>
      <Navbar />

      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-slate-900 animate-gradient-xy" />

      <main className="flex-1 px-4 sm:px-6 md:px-20 lg:px-40 py-12 pt-28 sm:pt-32 relative z-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* Left Column - About & Timeline */}
            <div className="flex flex-col gap-10">
              {/* About Section */}
              <div className="flex flex-col gap-6 animate-fade-in-up">
                <span className="text-primary font-bold tracking-widest uppercase text-xs">
                  {aboutContent.subtitle}
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight text-white">
                  {aboutContent.title.split(" ").slice(0, -1).join(" ")}{" "}
                  <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                    {aboutContent.title.split(" ").slice(-1)}
                  </span>
                </h1>
                <p className="text-slate-400 text-lg leading-relaxed whitespace-pre-line">
                  {aboutContent.description}
                </p>
                {resumeUrl && (
                  <div className="flex gap-4 mt-2">
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 min-w-[140px] sm:min-w-[160px] justify-center rounded-lg h-11 sm:h-12 px-5 sm:px-6 bg-primary text-black font-bold text-sm sm:text-base hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 group"
                    >
                      <span className="material-symbols-outlined group-hover:animate-bounce">
                        download
                      </span>
                      <span>Download CV</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Timeline */}
              {timelineEntries.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                    <span className="material-symbols-outlined text-primary">
                      history_edu
                    </span>
                    My Journey
                  </h3>

                  <div className="space-y-12 relative mt-8">
                    {/* Vertical Line Gradient */}
                    <div className="absolute left-0 top-2 bottom-2 w-px bg-gradient-to-b from-primary via-primary/40 to-transparent" />

                    {timelineEntries.map((entry, index) => (
                      <div
                        key={entry._id.toString()}
                        className="relative pl-10 opacity-0 animate-fade-in-up"
                        style={{
                          animationDelay: `${0.2 + index * 0.15}s`,
                          animationFillMode: "forwards",
                        }}
                      >
                        {/* Glowing Dot */}
                        <div className="absolute left-[-5px] top-2 size-[11px] rounded-full bg-primary ring-4 ring-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] z-10" />

                        <div className="flex flex-col gap-3 group">
                          {/* Year Badge */}
                          <div className="inline-flex items-center">
                            <span className="text-[11px] font-black tracking-widest uppercase px-3 py-1 bg-white/5 border border-white/10 text-primary rounded-full group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-300">
                              {entry.year}
                            </span>
                          </div>

                          {/* Content Card */}
                          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 group/card relative overflow-hidden">
                            {/* Subtle background glow on hover */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 blur-xl" />

                            <div className="relative z-10">
                              <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2 group-hover:text-primary transition-colors duration-300">
                                {entry.title}
                              </h4>

                              {entry.organizationName && (
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover/card:bg-primary/10 group-hover/card:text-primary transition-all">
                                    <span className="material-symbols-outlined text-[20px]">
                                      corporate_fare
                                    </span>
                                  </div>

                                  {entry.organizationUrl ? (
                                    <a
                                      href={entry.organizationUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-slate-300 font-bold hover:text-primary transition-colors flex items-center gap-1.5 group/link text-base"
                                    >
                                      {entry.organizationName}
                                      <span className="material-symbols-outlined text-[14px] opacity-0 -translate-y-1 group-hover/link:opacity-100 group-hover/link:translate-y-0 transition-all">
                                        open_in_new
                                      </span>
                                    </a>
                                  ) : (
                                    <span className="text-slate-300 font-bold text-base">
                                      {entry.organizationName}
                                    </span>
                                  )}
                                </div>
                              )}

                              <p className="text-slate-400 text-base leading-relaxed max-w-2xl font-medium">
                                {entry.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Contact Form */}
            <div className="relative" id="contact">
              <AboutContactForm />
            </div>
          </div>

          {/* Tools of the Trade - Orbit Section */}
          <div className="mt-20 sm:mt-32 relative">
            <div className="flex flex-col items-center mb-12 relative z-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-white">
                Tools of the Trade
              </h2>
              <div className="h-1 w-20 bg-primary rounded-full" />
              <p className="mt-4 text-slate-400 text-center max-w-lg">
                My digital galaxy. These technologies orbit my daily development
                workflow.
              </p>
            </div>

            {/* Orbit Animation */}
            <div className="flex items-center justify-center h-[350px] sm:h-[500px] w-full overflow-hidden relative">
              {/* Background Glow */}
              <div className="absolute w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-primary/5 rounded-full blur-3xl" />

              {/* Center Node */}
              {centerNode ? (
                <div className="relative z-20 w-16 h-16 sm:w-24 sm:h-24 bg-slate-800 rounded-full flex items-center justify-center shadow-xl border border-slate-700 animate-float group">
                  <span
                    className="material-symbols-outlined text-3xl sm:text-5xl group-hover:scale-110 transition-transform"
                    style={{ color: centerNode.color }}
                  >
                    {getTechIcon(centerNode.icon, centerNode.name)}
                  </span>
                </div>
              ) : (
                <div className="relative z-20 w-16 h-16 sm:w-24 sm:h-24 bg-slate-800 rounded-full flex items-center justify-center shadow-xl border border-slate-700 animate-float" />
              )}

              {/* Orbit Ring */}
              <div className="absolute w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] md:w-[400px] md:h-[400px] border border-dashed border-slate-700 rounded-full animate-orbit">
                {orbitNodes.map((tech, index) => {
                  const angle = (index / orbitNodes.length) * 360;
                  const radiusX = 50; // 50%
                  const radiusY = 50; // 50%
                  // Subtract 90 degrees so the first item starts at the top
                  const left =
                    50 + radiusX * Math.cos(((angle - 90) * Math.PI) / 180);
                  const top =
                    50 + radiusY * Math.sin(((angle - 90) * Math.PI) / 180);

                  return (
                    <div
                      key={tech._id?.toString() ?? tech.name}
                      className="absolute w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 -ml-5 -mt-5 sm:-ml-6 sm:-mt-6 md:-ml-8 md:-mt-8 bg-slate-800 rounded-full shadow-lg flex items-center justify-center border border-slate-700 animate-reverse-orbit group"
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                      }}
                      title={tech.name}
                    >
                      <span
                        className="material-symbols-outlined text-2xl md:text-3xl group-hover:scale-110 transition-transform"
                        style={{ color: tech.color }}
                      >
                        {getTechIcon(tech.icon, tech.name)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Inner Ring */}
              <div className="absolute w-[140px] h-[140px] sm:w-[200px] sm:h-[200px] border border-slate-800 rounded-full opacity-50" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <FloatingSocialLinks />
    </>
  );
}
