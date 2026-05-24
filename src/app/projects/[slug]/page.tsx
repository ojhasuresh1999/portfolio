import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "@/components/mdx/CodeBlock";
import { autoDetectCodeBlocks } from "@/lib/code-detector";
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
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 md:px-8 lg:px-12 py-12 pt-28 sm:pt-32 relative">
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
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-l-2 border-primary pl-4 font-[family-name:var(--font-mono)] animate-pulse">
              {project.status === "ongoing" && (
                <span className="text-blue-400 bg-blue-500/10 px-2.5 py-1 border border-blue-500/20 rounded">
                  Ongoing
                </span>
              )}
              {project.status === "completed" && (
                <span className="text-green-400 bg-green-500/10 px-2.5 py-1 border border-green-500/20 rounded">
                  Completed
                </span>
              )}
              {project.status === "on-hold" && (
                <span className="text-yellow-400 bg-yellow-500/10 px-2.5 py-1 border border-yellow-500/20 rounded">
                  On Hold
                </span>
              )}
              {project.status === "archived" && (
                <span className="text-slate-400 bg-slate-500/10 px-2.5 py-1 border border-slate-500/20 rounded">
                  Archived
                </span>
              )}
              {project.isFeatured && (
                <span className="text-yellow-400 flex items-center gap-1 font-black bg-yellow-500/10 px-2.5 py-1 border border-yellow-500/20 rounded">
                  Featured
                </span>
              )}
              <span>{"//"}</span>
              <span>SYS_DEPLOYMENT</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black tracking-tight text-white mb-4 sm:mb-6 drop-shadow-md">
              {project.title}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-slate-400 font-light leading-relaxed max-w-3xl">
              {project.description}
            </p>
          </div>

          {/* Image */}
          {project.image && (
            <div className="w-full relative aspect-video md:aspect-[21/9] rounded-xl overflow-hidden border border-white/10 mb-16 shadow-2xl bg-black">
              <Image
                src={project.image}
                alt={project.title}
                fill
                sizes="(max-width: 768px) 100vw, 960px"
                data-full-src={project.image}
                className="object-cover absolute inset-0 opacity-80"
                priority
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
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
                <div className="prose prose-invert max-w-none text-slate-300">
                  {project.longDescription ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({
                          node: _node,
                          inline,
                          className,
                          children,
                          ...props
                        }: ComponentPropsWithoutRef<"code"> & {
                          inline?: boolean;
                          node?: unknown;
                        }) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <CodeBlock
                              language={match[1]}
                              code={String(children).replace(/\n$/, "")}
                            />
                          ) : (
                            <code
                              {...props}
                              className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold border border-primary/20"
                            >
                              {children}
                            </code>
                          );
                        },
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-primary pl-4 py-1 italic bg-primary/5 text-slate-300 my-6">
                            {children}
                          </blockquote>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-12 mb-6 flex items-center gap-3">
                            <span className="w-1 h-6 bg-primary inline-block" />
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-10 mb-4 opacity-90 text-primary">
                            {children}
                          </h3>
                        ),
                        a: ({ children, href }) => (
                          <a
                            href={href}
                            className="text-primary hover:text-white underline decoration-primary/50 underline-offset-4 transition-colors font-semibold shadow-[0_2px_0_rgba(0,240,255,0.2)]"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {autoDetectCodeBlocks(project.longDescription)}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-slate-400 font-[family-name:var(--font-mono)] italic">
                      [NO_EXTENDED_DATA_AVAILABLE]
                    </p>
                  )}
                </div>
              </section>
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
    </>
  );
}
