import Link from "next/link";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { aboutService } from "@/server/services/about.service";
import { settingsService } from "@/server/services/settings.service";
import { socialLinksService } from "@/server/services/social-links.service";
import { AboutContactForm } from "@/components/about/about-contact-form";

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
  const key = (icon || platform).toLowerCase().trim();
  return iconMap[key] ?? key;
}

export default async function AboutPage() {
  const [aboutResult, timelineResult, settingsResult, socialResult] =
    await Promise.all([
      aboutService.getAboutContent(),
      aboutService.getVisibleTimeline(),
      settingsService.getPublic(),
      socialLinksService.getAll(),
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

  // Social links — only visible ones, sorted by order
  interface SocialLinkRecord {
    _id?: string;
    platform: string;
    url: string;
    icon: string;
    isVisible?: boolean;
    order?: number;
  }
  const socialLinks = (
    socialResult.success
      ? (socialResult.data as unknown as SocialLinkRecord[])
      : []
  ).filter((l) => l.isVisible !== false);

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
                  <div className="ml-2">
                    {timelineEntries.map((entry, index) => (
                      <div
                        key={entry._id.toString()}
                        className="timeline-item opacity-0 animate-fade-in-up"
                        style={{
                          animationDelay: `${0.2 + index * 0.2}s`,
                          animationFillMode: "forwards",
                        }}
                      >
                        <div className="timeline-dot" />
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-primary">
                            {entry.year}
                          </span>
                          <h4 className="font-bold text-lg text-white">
                            {entry.title}
                          </h4>
                          <p className="text-sm text-slate-400">
                            {entry.description}
                          </p>
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

              {/* Center Node - Node.js */}
              <div className="relative z-20 w-16 h-16 sm:w-24 sm:h-24 bg-slate-800 rounded-full flex items-center justify-center shadow-xl border border-slate-700 animate-float">
                <span
                  className="material-symbols-outlined text-3xl sm:text-5xl"
                  style={{ color: "#339933" }}
                >
                  hexagon
                </span>
              </div>

              {/* Orbit Ring */}
              <div className="absolute w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] md:w-[400px] md:h-[400px] border border-dashed border-slate-700 rounded-full animate-orbit">
                {/* AWS - Top */}
                <div className="absolute left-1/2 -top-5 sm:-top-6 -ml-5 sm:-ml-6 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-slate-800 rounded-full shadow-lg flex items-center justify-center border border-slate-700 animate-reverse-orbit">
                  <span
                    className="material-symbols-outlined text-2xl md:text-3xl"
                    style={{ color: "#FF9900" }}
                  >
                    cloud
                  </span>
                </div>

                {/* Docker - Right */}
                <div className="absolute top-1/2 -right-5 sm:-right-6 -mt-5 sm:-mt-6 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-slate-800 rounded-full shadow-lg flex items-center justify-center border border-slate-700 animate-reverse-orbit">
                  <span
                    className="material-symbols-outlined text-2xl md:text-3xl"
                    style={{ color: "#2496ED" }}
                  >
                    inventory_2
                  </span>
                </div>

                {/* Kubernetes - Bottom */}
                <div className="absolute left-1/2 -bottom-5 sm:-bottom-6 -ml-5 sm:-ml-6 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-slate-800 rounded-full shadow-lg flex items-center justify-center border border-slate-700 animate-reverse-orbit">
                  <span
                    className="material-symbols-outlined text-2xl md:text-3xl"
                    style={{ color: "#326CE5" }}
                  >
                    hub
                  </span>
                </div>

                {/* Git - Left */}
                <div className="absolute top-1/2 -left-5 sm:-left-6 -mt-5 sm:-mt-6 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-slate-800 rounded-full shadow-lg flex items-center justify-center border border-slate-700 animate-reverse-orbit">
                  <span
                    className="material-symbols-outlined text-2xl md:text-3xl"
                    style={{ color: "#F05032" }}
                  >
                    account_tree
                  </span>
                </div>
              </div>

              {/* Inner Ring */}
              <div className="absolute w-[140px] h-[140px] sm:w-[200px] sm:h-[200px] border border-slate-800 rounded-full opacity-50" />
            </div>
          </div>
        </div>
      </main>

      {/* Floating Social Dock — Dynamic from Admin Settings */}
      {socialLinks.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl z-50 transition-all hover:scale-105 max-w-[90vw] overflow-x-auto no-scrollbar">
          {socialLinks.map((link) => (
            <Link
              key={link._id ?? link.platform}
              href={link.url}
              target={link.url.startsWith("http") ? "_blank" : undefined}
              rel={
                link.url.startsWith("http") ? "noopener noreferrer" : undefined
              }
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
      )}

      <Footer />
    </>
  );
}
