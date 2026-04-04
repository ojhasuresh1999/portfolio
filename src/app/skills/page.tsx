import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { cn } from "@/lib/utils";
import { skillService } from "@/server/services/skill.service";
import { techStackService } from "@/server/services/tech-stack.service";

// Enable revalidation Every 60 seconds or make it dynamic if we want to
export const revalidate = 60;

export default async function SkillsPage() {
  const [skillsRes, techStacksRes] = await Promise.all([
    skillService.getAllSkills(),
    techStackService.getAllTechStack(),
  ]);

  const allSkills = skillsRes.success
    ? skillsRes.data!.filter((s) => s.isVisible)
    : [];
  const architecturePatterns = techStacksRes.success
    ? techStacksRes.data!.filter((t) => t.isVisible)
    : [];

  const languages = allSkills.filter((s) => s.category === "LANGUAGE");
  const databases = allSkills.filter((s) => s.category === "DATABASE");
  const devopsCloud = allSkills.filter((s) => s.category === "DEVOPS");
  // Frameworks and Tools might just be combined or omitted based on the layout,
  // but let's include them if they exist maybe inside DevOps or under Languages
  // For now, let's keep the layout similar and we'll add them to an Extra section if needed.
  const toolsAndFrameworks = allSkills.filter(
    (s) => s.category === "FRAMEWORK" || s.category === "TOOL",
  );

  return (
    <>
      <Navbar />

      <main className="flex-1 flex flex-col items-center px-4 py-12 md:px-8 lg:px-12 pt-32">
        {/* Lamp Header Section */}
        <div className="relative w-full max-w-[960px] flex flex-col items-center text-center mb-16">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-full max-w-lg h-40 bg-gradient-to-b from-primary/30 via-primary/5 to-transparent blur-[60px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Skills & Expertise
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-lg">
              Technical Architecture <br className="hidden md:block" />& Stack
            </h1>

            <p className="text-slate-400 text-lg md:text-xl max-w-2xl font-light leading-relaxed">
              Scalable solutions built with precision. Explore the technologies
              powering high-performance backend systems.
            </p>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-[960px]">
          {/* Core Runtime - Wide Card */}
          <div className="group relative md:col-span-2 overflow-hidden rounded-xl bg-card-dark border border-white/5 p-6 md:p-8 transition-all duration-500 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.15)] flex flex-col md:flex-row gap-6">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex-1 flex flex-col justify-between z-10">
              <div>
                <div className="mb-4 inline-flex p-3 rounded-lg bg-surface-dark border border-white/10 text-primary shadow-inner">
                  <span className="material-symbols-outlined text-3xl">
                    memory
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                  Core Runtime & Tools
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Deep understanding of asynchronous patterns, runtimes, and
                  building robust infrastructure layers. Leveraging modern
                  runtimes for maximum throughput.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {toolsAndFrameworks.length > 0
                  ? toolsAndFrameworks.map((tag) => (
                      <span
                        key={tag._id.toString()}
                        className="px-3 py-1 rounded-md text-xs font-medium bg-white/5 border border-white/10 text-slate-300 group-hover:border-primary/30 group-hover:text-white transition-colors"
                      >
                        {tag.name}
                      </span>
                    ))
                  : ["Node.js v20+", "Deno", "Bun", "C++ Addons"].map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-md text-xs font-medium bg-white/5 border border-white/10 text-slate-300 group-hover:border-primary/30 group-hover:text-white transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
              </div>
            </div>

            {/* Visual */}
            <div className="w-full md:w-1/3 min-h-[160px] rounded-lg bg-surface-dark border border-white/5 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,242,255,0.2),transparent_70%)]" />
              <span className="material-symbols-outlined text-6xl text-white/5 group-hover:text-primary/20 transition-all duration-500 transform group-hover:scale-110">
                settings_suggest
              </span>
            </div>
          </div>

          {/* Languages - Tall Card */}
          <div className="group relative md:row-span-2 overflow-hidden rounded-xl bg-card-dark border border-white/5 p-6 md:p-8 transition-all duration-500 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.15)] flex flex-col">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="mb-6 inline-flex p-3 rounded-lg bg-surface-dark border border-white/10 text-primary w-fit">
              <span className="material-symbols-outlined text-3xl">code</span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">Languages</h3>
            <p className="text-slate-400 text-sm mb-8">
              Polyglot proficiency focusing on type safety and performance.
            </p>

            <div className="flex-1 flex flex-col gap-6 z-10 w-full">
              {languages.length > 0 ? (
                languages.map((lang) => (
                  <div key={lang._id.toString()} className="group/bar w-full">
                    <div className="flex justify-between items-end mb-2 w-full">
                      <span className="text-white font-semibold text-sm">
                        {lang.name}
                      </span>
                      <span className="text-primary text-xs font-bold">
                        {lang.proficiency}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-primary shadow-[0_0_10px_rgba(0,242,255,0.5)] group-hover/bar:brightness-125 transition-all duration-500"
                        style={{ width: `${lang.proficiency}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm italic">
                  No languages defined yet.
                </p>
              )}
            </div>
          </div>

          {/* Databases */}
          <div className="group relative overflow-hidden rounded-xl bg-card-dark border border-white/5 p-6 transition-all duration-500 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.15)] flex flex-col justify-between min-h-[240px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex items-start justify-between">
              <div className="p-3 rounded-lg bg-surface-dark border border-white/10 text-primary">
                <span className="material-symbols-outlined text-2xl">
                  database
                </span>
              </div>
              <span className="material-symbols-outlined text-white/10 text-4xl group-hover:text-primary/10 transition-colors">
                storage
              </span>
            </div>

            <div className="z-10 mt-6">
              <h3 className="text-xl font-bold text-white mb-1">Databases</h3>
              <p className="text-slate-400 text-xs mb-4">
                Relational & NoSQL mastery
              </p>
              <div className="flex flex-wrap gap-2">
                {databases.length > 0 ? (
                  databases.map((db, idx) => {
                    const colors = [
                      "bg-blue-900/20 text-blue-200 border-blue-500/20",
                      "bg-red-900/20 text-red-200 border-red-500/20",
                      "bg-green-900/20 text-green-200 border-green-500/20",
                      "bg-purple-900/20 text-purple-200 border-purple-500/20",
                      "bg-orange-900/20 text-orange-200 border-orange-500/20",
                    ];
                    const colorCombo = colors[idx % colors.length];
                    return (
                      <span
                        key={db._id.toString()}
                        className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wide border ${colorCombo}`}
                      >
                        {db.name}
                      </span>
                    );
                  })
                ) : (
                  <p className="text-slate-500 text-xs italic">
                    No databases defined.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* DevOps & Cloud */}
          <div className="group relative overflow-hidden rounded-xl bg-card-dark border border-white/5 p-6 transition-all duration-500 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.15)] flex flex-col justify-between min-h-[240px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex items-start justify-between">
              <div className="p-3 rounded-lg bg-surface-dark border border-white/10 text-primary">
                <span className="material-symbols-outlined text-2xl">
                  cloud_sync
                </span>
              </div>
              <span className="material-symbols-outlined text-white/10 text-4xl group-hover:text-primary/10 transition-colors">
                deployed_code
              </span>
            </div>

            <div className="z-10 mt-6">
              <h3 className="text-xl font-bold text-white mb-1">
                DevOps & Cloud
              </h3>
              <p className="text-slate-400 text-xs mb-4">
                CI/CD & Infrastructure
              </p>
              <div className="flex flex-wrap gap-2">
                {devopsCloud.length > 0 ? (
                  devopsCloud.map((tag) => (
                    <span
                      key={tag._id.toString()}
                      className="px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wide bg-white/5 border border-white/10 text-slate-300"
                    >
                      {tag.name}
                    </span>
                  ))
                ) : (
                  <p className="text-slate-500 text-xs italic">
                    No devops defined.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Architecture Patterns - Full Width */}
          <div className="group relative md:col-span-3 overflow-hidden rounded-xl bg-card-dark border border-white/5 p-6 md:p-8 transition-all duration-500 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.15)]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,242,255,0.05),transparent_50%,rgba(0,242,255,0.05))] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    hub
                  </span>
                  <h3 className="text-2xl font-bold text-white">
                    Technical Stack
                  </h3>
                </div>
                <p className="text-slate-400 text-sm max-w-xl mb-6">
                  Designing resilient, decoupled systems. Specializing in
                  transitioning monolithic applications to distributed
                  microservices architectures with a focus on data consistency
                  and observability.
                </p>
                <div className="flex flex-wrap gap-3">
                  {architecturePatterns.length > 0 ? (
                    architecturePatterns.map((pattern) => {
                      const colorClass =
                        pattern.color && pattern.color.startsWith("bg-")
                          ? pattern.color
                          : "";
                      const customColor =
                        pattern.color && !pattern.color.startsWith("bg-")
                          ? pattern.color
                          : undefined;

                      return (
                        <div
                          key={pattern._id.toString()}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-dark border border-white/10 text-slate-300 text-xs font-medium"
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              colorClass,
                            )}
                            style={{ backgroundColor: customColor }}
                          />
                          {pattern.name}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-500 text-xs italic">
                      No technical stack defined.
                    </p>
                  )}
                </div>
              </div>

              {/* Visual */}
              <div className="w-full md:w-64 h-32 relative rounded-lg bg-surface-dark/50 border border-white/5 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-30 group-hover:opacity-60 transition-opacity duration-500">
                  <div className="w-8 h-8 rounded border border-white/20 bg-white/5" />
                  <div className="w-16 h-0.5 bg-primary/40 relative">
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 w-2 h-2 rounded-full bg-primary animate-ping" />
                  </div>
                  <div className="w-8 h-8 rounded border border-white/20 bg-white/5" />
                  <div className="w-16 h-0.5 bg-primary/40" />
                  <div className="w-8 h-8 rounded border border-white/20 bg-white/5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <a
            href="https://github.com/ojhasuresh1999"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            View GitHub Repositories
            <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </a>
        </div>
      </main>

      <Footer />
    </>
  );
}
