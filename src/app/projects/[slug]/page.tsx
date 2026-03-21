import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { projectService } from "@/server/services/project.service";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await projectService.getBySlug(slug);

  if (!result.success || !result.data || !result.data.isVisible) {
    notFound();
  }

  const project = result.data;

  return (
    <>
      <Navbar />

      <main className="flex-1 flex flex-col items-center px-4 py-12 md:px-8 lg:px-12 pt-32 relative">
        {/* Lamp Light Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-80 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-[80px] pointer-events-none" />

        <div className="w-full max-w-[960px] relative z-10">
          {/* Back btn */}
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-primary font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest hover:text-white transition-colors mb-12 group"
          >
            <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-1">
              arrow_back
            </span>
            Return to Root
          </Link>

          {/* Header */}
          <div className="mb-16">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 drop-shadow-md">
              {project.title}
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 font-light leading-relaxed max-w-3xl">
              {project.description}
            </p>
          </div>

          {/* Image */}
          {project.image && (
            <div className="w-full relative aspect-video md:aspect-[21/9] rounded-xl overflow-hidden border border-white/10 mb-16 shadow-2xl bg-black">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-80"
                style={{ backgroundImage: `url('${project.image}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-12 text-slate-300 leading-relaxed">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-primary text-xl">
                    analytics
                  </span>
                  <h2 className="text-2xl font-bold text-white font-[family-name:var(--font-mono)]">
                    Project_Overview
                  </h2>
                </div>
                <div className="prose prose-invert max-w-none">
                  {project.longDescription ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: project.longDescription.replace(/\n/g, "<br/>"),
                      }}
                    />
                  ) : (
                    <p className="text-slate-400 font-[family-name:var(--font-mono)] italic">
                      [NO_EXTENDED_DATA_AVAILABLE]
                    </p>
                  )}
                </div>
              </section>

              {project.codeSnippet && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="material-symbols-outlined text-primary text-xl">
                      code_blocks
                    </span>
                    <h2 className="text-2xl font-bold text-white font-[family-name:var(--font-mono)]">
                      Code_Snippet
                    </h2>
                  </div>
                  <div className="bg-[#0d1117] rounded-lg border border-white/10 overflow-hidden text-sm">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                      </div>
                      <span className="font-[family-name:var(--font-mono)] text-xs text-slate-400 ml-4">
                        core.sys
                      </span>
                    </div>
                    <pre className="p-4 overflow-x-auto text-green-400 font-[family-name:var(--font-mono)] leading-relaxed">
                      <code>{project.codeSnippet}</code>
                    </pre>
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Tech Stack */}
              <div className="bg-surface-dark border border-white/5 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 font-[family-name:var(--font-mono)] flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/5 border border-white/10 text-slate-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="bg-surface-dark border border-white/5 rounded-xl p-6 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2 font-[family-name:var(--font-mono)] flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  Endpoints
                </h3>

                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full bg-primary/10 hover:bg-primary border border-primary/20 hover:border-primary text-primary hover:text-black transition-all rounded-lg p-3 group/btn font-bold font-[family-name:var(--font-mono)] text-sm"
                  >
                    <span className="material-symbols-outlined">launch</span>
                    Live Deployment
                    <span className="material-symbols-outlined ml-auto opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all">
                      arrow_forward
                    </span>
                  </a>
                )}

                {project.githubUrl && project.isSourceCodeVisible !== false && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white transition-all rounded-lg p-3 group/btn font-bold font-[family-name:var(--font-mono)] text-sm"
                  >
                    <span className="material-symbols-outlined">
                      data_object
                    </span>
                    Source Code
                    <span className="material-symbols-outlined ml-auto opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all">
                      arrow_forward
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
