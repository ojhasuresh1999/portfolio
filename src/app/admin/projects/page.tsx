"use client";

import { useState } from "react";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  technologies: string[];
  isFeatured: boolean;
  isVisible: boolean;
  updatedAt: string;
}

const mockProjects: Project[] = [
  {
    id: "1",
    title: "Microservices Gateway",
    slug: "microservices-gateway",
    description:
      "A custom API Gateway supporting rate limiting and authentication.",
    technologies: ["Node.js", "Redis", "Docker"],
    isFeatured: true,
    isVisible: true,
    updatedAt: "2 hours ago",
  },
  {
    id: "2",
    title: "Real-time Analytics Engine",
    slug: "analytics-engine",
    description: "Low-latency processing engine for IoT sensor data.",
    technologies: ["WebSocket", "BullMQ", "TimescaleDB"],
    isFeatured: true,
    isVisible: true,
    updatedAt: "5 hours ago",
  },
  {
    id: "3",
    title: "E-commerce Backend",
    slug: "ecommerce-backend",
    description: "Complete backend solution with payment integration.",
    technologies: ["Express", "PostgreSQL", "Stripe"],
    isFeatured: false,
    isVisible: true,
    updatedAt: "1 day ago",
  },
];

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Projects</h2>
          <p className="text-slate-400 text-sm">
            Manage your portfolio projects
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          New Project
        </Link>
      </div>

      {/* Projects Table */}
      <div className="bg-card-dark border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">
                Project
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">
                Technologies
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">
                Status
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">
                Updated
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {projects.map((project) => (
              <tr
                key={project.id}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">
                        folder
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{project.title}</p>
                      <p className="text-xs text-slate-500">/{project.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {project.technologies.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 text-xs bg-white/5 border border-white/10 rounded text-slate-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {project.isFeatured && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-500/10 text-yellow-400 rounded border border-yellow-500/20 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">
                          star
                        </span>
                        Featured
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 text-xs rounded border flex items-center gap-1 ${
                        project.isVisible
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}
                    >
                      {project.isVisible ? "Visible" : "Hidden"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {project.updatedAt}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                      <span className="material-symbols-outlined text-lg">
                        edit
                      </span>
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                      <span className="material-symbols-outlined text-lg">
                        visibility
                      </span>
                    </button>
                    <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-slate-400 hover:text-red-400">
                      <span className="material-symbols-outlined text-lg">
                        delete
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State (when no projects) */}
      {projects.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">
            folder_off
          </span>
          <h3 className="text-xl font-bold text-white mb-2">No projects yet</h3>
          <p className="text-slate-400 mb-4">
            Create your first project to get started
          </p>
          <Link
            href="/admin/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-lg"
          >
            <span className="material-symbols-outlined">add</span>
            New Project
          </Link>
        </div>
      )}
    </div>
  );
}
