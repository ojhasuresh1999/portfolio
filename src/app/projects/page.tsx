import Link from "next/link";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { projectService } from "@/server/services/project.service";

export default async function ProjectsPage() {
  const result = await projectService.getAll({ limit: 100 });
  const projects = result.success ? result.data.items : [];

  return (
    <>
      <Navbar />

      {/* Background Grid */}
      <div className="fixed inset-0 z-0 bg-[size:50px_50px] bg-grid-pattern opacity-[0.07] pointer-events-none" />

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-[2px] z-[100] bg-gray-800">
        <div className="h-full bg-primary w-[65%] shadow-[0_0_15px_rgba(0,240,255,0.8)] animate-pulse" />
      </div>

      <main className="max-w-7xl mx-auto w-full px-6 py-16 pt-32 relative z-10">
        {/* Header */}
        <div className="mb-24 relative">
          <div className="absolute -left-20 top-0 text-[10rem] font-black text-white/[0.02] select-none pointer-events-none font-[family-name:var(--font-mono)] leading-none rotate-90 origin-left">
            SYS_ARCHIVES
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
              <span className="text-primary font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em]">
                Project Catalog
              </span>
            </div>
            <h1 className="text-white text-5xl md:text-7xl font-bold tracking-tighter leading-none">
              DEPLOYED
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-gray-600">
                MODULES_
              </span>
            </h1>
          </div>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed font-light border-l-2 border-primary/50 pl-6 ml-2">
            Archived builds showcasing{" "}
            <span className="text-white font-[family-name:var(--font-mono)]">
              scalable architecture
            </span>
            {", "}
            efficient data flow, and modern web technologies.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-12">
          {projects.map((project, index) => (
            <div
              key={project._id.toString()}
              className="group relative flex flex-col md:flex-row gap-8 items-stretch border border-white/5 bg-surface-dark hover:border-primary/30 p-6 md:p-8 transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,240,255,0.05)] overflow-hidden"
            >
              {/* Optional: Add hover grid effect on card */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              {/* Numbering */}
              <div className="absolute right-4 top-4 text-4xl font-[family-name:var(--font-mono)] font-black text-white/5 group-hover:text-primary/10 transition-colors pointer-events-none z-10">
                {String(index + 1).padStart(2, "0")}
              </div>

              {/* Image Container */}
              <div className="w-full md:w-5/12 shrink-0 relative h-64 md:h-80 bg-black border border-white/10 group-hover:border-primary/50 transition-colors overflow-hidden rounded-sm z-10">
                {project.image ? (
                  <div
                    className="absolute inset-0 z-0 opacity-50 group-hover:opacity-100 transition-opacity duration-700 bg-cover bg-center grayscale group-hover:grayscale-0"
                    style={{ backgroundImage: `url('${project.image}')` }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <span className="material-symbols-outlined text-6xl text-slate-700 group-hover:text-primary/40 transition-colors">
                      code_blocks
                    </span>
                  </div>
                )}
                {/* Tech scanline */}
                <div className="absolute top-0 w-full h-[2px] bg-primary shadow-[0_0_15px_#00f0ff] opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-[scan_2s_ease-in-out_infinite] z-20" />
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col justify-between py-2 z-10">
                <div>
                  {/* Meta */}
                  <div className="flex items-center gap-3 text-[10px] font-bold font-[family-name:var(--font-mono)] uppercase mb-4 text-gray-500">
                    {project.isFeatured && (
                      <span className="text-black bg-primary px-2 py-0.5 skew-x-[-10deg]">
                        <span className="skew-x-[10deg] block">Featured</span>
                      </span>
                    )}
                    <span>:: SYS_BUILD</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-white text-3xl font-bold font-[family-name:var(--font-mono)] mb-4 group-hover:text-primary transition-colors tracking-tight">
                    {project.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6 font-[family-name:var(--font-mono)] border-l border-white/10 pl-4 max-w-2xl">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-8">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wide bg-white/5 border border-white/10 text-slate-300 group-hover:border-primary/30 transition-colors"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-6 border-t border-white/5 pt-6 mt-auto">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="flex items-center gap-2 text-xs font-bold font-[family-name:var(--font-mono)] text-white hover:text-primary transition-colors uppercase tracking-wider group/link relative"
                  >
                    <span>View_Details</span>
                    <span className="material-symbols-outlined text-sm transition-transform group-hover/link:translate-x-1">
                      terminal
                    </span>
                  </Link>

                  {project.githubUrl &&
                    project.isSourceCodeVisible !== false && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">
                          code
                        </span>
                      </a>
                    )}

                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">
                        open_in_new
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="p-12 text-center border border-white/5 bg-surface-dark/50">
              <span className="material-symbols-outlined text-4xl text-gray-600 mb-4 block">
                folder_off
              </span>
              <p className="text-gray-400 font-[family-name:var(--font-mono)]">
                [NO_PROJECTS_FOUND_IN_ARCHIVE]
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
