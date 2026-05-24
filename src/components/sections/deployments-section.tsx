"use client";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

import { useProjects, type ProjectData } from "@/hooks/queries";

interface Project extends ProjectData {
  hasChart?: boolean;
}

interface DeploymentsSectionProps {
  projects?: Project[];
}

const defaultProjects: Project[] = [
  {
    _id: "1",
    title: "Microservices Gateway",
    isSourceCodeVisible: true,
    slug: "microservices-gateway",
    description:
      "A custom API Gateway supporting rate limiting, request transformation, and centralized authentication using JWT and Redis. Handles 10k+ concurrent connections.",
    codeSnippet: `class APIGateway {
  constructor() {
    // Init Redis Cluster
    this.cache = new Redis();
  }
}`,
    technologies: ["Fastify", "Redis", "Docker"],
    accentColor: "primary",
    order: 0,
    isFeatured: true,
    isVisible: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "2",
    title: "Real-time Analytics Engine",
    slug: "analytics-engine",
    isSourceCodeVisible: true,
    description:
      "Low-latency processing engine for IoT sensor data, capable of handling 50k+ events per second with persistent storage.",
    technologies: ["WebSocket", "BullMQ", "TimescaleDB"],
    accentColor: "secondary",
    hasChart: true,
    order: 0,
    isFeatured: true,
    isVisible: true,
    createdAt: "",
    updatedAt: "",
  },
];

export function DeploymentsSection({
  projects: initialProjects,
}: DeploymentsSectionProps) {
  const { data: apiProjects } = useProjects(
    { limit: 4, featured: true },
    { initialData: initialProjects as ProjectData[] },
  );

  const displayProjects: Project[] =
    apiProjects && apiProjects.length > 0
      ? apiProjects.map((p) => ({
          ...p,
          accentColor: p.accentColor || "primary",
        }))
      : defaultProjects;

  return (
    <section id="projects" className="mt-20 sm:mt-32">
      {/* Section Header */}
      <div className="flex flex-col gap-2 mb-8 sm:mb-12">
        <div className="flex items-center gap-4">
          <span className="flex items-center justify-center size-8 rounded bg-secondary/10 text-secondary border border-secondary/20 font-[family-name:var(--font-mono)] text-xs">
            02
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Deployments
          </h2>
        </div>
        <p className="text-slate-500 pl-12">
          Engineering scalable solutions for complex problems.
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
        {displayProjects.map((project) => (
          <ProjectCard key={project._id} project={project} />
        ))}
      </div>
    </section>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const isPrimary = project.accentColor === "primary";

  return (
    <div className="card-3d-wrapper group">
      <div
        className={cn(
          "card-3d bg-[#0a0a0f] border border-white/5 rounded-2xl overflow-hidden relative h-full flex flex-col",
          isPrimary ? "hover:border-primary/50" : "hover:border-secondary/50",
        )}
      >
        {/* Image/Visual Area */}
        <div className="h-48 sm:h-60 w-full bg-slate-900 relative overflow-hidden group-hover:saturate-150 transition-all duration-500">
          {project.image ? (
            // Project Image
            <>
              <Image
                src={project.image}
                alt={project.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700 grayscale group-hover:grayscale-0"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
              {/* Scan-line hover effect */}
              <div className="absolute top-0 w-full h-[2px] bg-primary shadow-[0_0_15px_#00f0ff] opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-[scan_2s_ease-in-out_infinite] z-20" />
            </>
          ) : project.hasChart ? (
            // Chart Visualization
            <div className="absolute inset-0 flex items-end justify-center pb-0 gap-1 opacity-70">
              <div className="w-4 bg-secondary/60 rounded-t h-12 group-hover:h-32 transition-all duration-300 ease-out" />
              <div className="w-4 bg-primary/60 rounded-t h-20 group-hover:h-40 transition-all duration-500 ease-out delay-75" />
              <div className="w-4 bg-purple-500/60 rounded-t h-16 group-hover:h-24 transition-all duration-400 ease-out delay-100" />
              <div className="w-4 bg-white/20 rounded-t h-8 group-hover:h-20 transition-all duration-300 ease-out" />
              <div className="w-4 bg-secondary/60 rounded-t h-24 group-hover:h-36 transition-all duration-600 ease-out delay-150" />
            </div>
          ) : project.codeSnippet ? (
            // Code Snippet
            <>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-5 font-[family-name:var(--font-mono)] text-xs text-slate-400 shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-2 group-hover:border-primary/30">
                <div className="flex gap-2 mb-3 border-b border-white/5 pb-2">
                  <div className="size-2 rounded-full bg-red-500" />
                  <div className="size-2 rounded-full bg-yellow-500" />
                  <div className="size-2 rounded-full bg-green-500" />
                </div>
                <code className="whitespace-pre text-[10px]">
                  {project.codeSnippet}
                </code>
              </div>
            </>
          ) : (
            // Fallback placeholder
            <>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-slate-700 group-hover:text-primary/30 transition-colors">
                  code_blocks
                </span>
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="p-5 sm:p-8 flex-1 flex flex-col">
          {/* Status Badge */}
          {project.status && (
            <div className="flex items-center gap-2 mb-3 text-[10px] font-bold font-[family-name:var(--font-mono)] uppercase">
              {project.status === "ongoing" && (
                <span className="text-blue-400 border border-blue-500/30 bg-blue-500/5 px-2 py-0.5 rounded-sm">
                  Ongoing
                </span>
              )}
              {project.status === "completed" && (
                <span className="text-green-400 border border-green-500/30 bg-green-500/5 px-2 py-0.5 rounded-sm">
                  Completed
                </span>
              )}
              {project.status === "on-hold" && (
                <span className="text-yellow-400 border border-yellow-500/30 bg-yellow-500/5 px-2 py-0.5 rounded-sm">
                  On Hold
                </span>
              )}
              {project.status === "archived" && (
                <span className="text-slate-400 border border-slate-500/30 bg-slate-500/5 px-2 py-0.5 rounded-sm">
                  Archived
                </span>
              )}
              {project.isFeatured && (
                <span className="text-yellow-400 bg-yellow-500/10 px-2 py-0.5 border border-yellow-500/20 rounded-sm">
                  Featured
                </span>
              )}
            </div>
          )}

          <div className="flex justify-between items-start mb-4">
            <h3
              className={cn(
                "text-xl sm:text-2xl font-bold text-white transition-colors",
                isPrimary
                  ? "group-hover:text-primary"
                  : "group-hover:text-secondary",
              )}
            >
              {project.title}
            </h3>
            <Link
              href={`/projects/${project.slug}`}
              className={cn(
                "p-2 rounded-full bg-white/5 transition-all hover:scale-110",
                isPrimary
                  ? "hover:bg-primary hover:text-black"
                  : "hover:bg-secondary hover:text-white",
              )}
            >
              <span className="material-symbols-outlined text-lg">
                arrow_outward
              </span>
            </Link>
          </div>

          <p className="text-slate-400 text-sm mb-6 leading-relaxed flex-1">
            {project.description}
          </p>

          {/* Technologies */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
            {project.technologies.map((tech, index) => (
              <span
                key={tech}
                className={cn(
                  "text-[10px] font-[family-name:var(--font-mono)] font-medium px-2 py-1 rounded border",
                  index === 0
                    ? isPrimary
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-secondary/10 text-secondary border-secondary/20"
                    : "bg-white/5 border-white/5 text-slate-300",
                )}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
