"use client";

import { useState, useEffect, useCallback } from "react";
import type { ComponentPropsWithoutRef } from "react";
import Image from "next/image";
import CloudinaryUpload, {
  type UploadResult,
} from "@/components/ui/cloudinary-upload";
import {
  useAdminProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  type ProjectData,
} from "@/hooks/queries";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "@/components/mdx/CodeBlock";
import { autoDetectCodeBlocks } from "@/lib/code-detector";

// =============================================================================
// Types
// =============================================================================

interface ProjectFormState {
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  codeSnippet: string;
  technologies: string[];
  liveUrl: string;
  githubUrl: string;
  accentColor: "primary" | "secondary";
  status: "ongoing" | "completed" | "on-hold" | "archived";
  order: number;
  isFeatured: boolean;
  isVisible: boolean;
  isSourceCodeVisible: boolean;
  image: string;
  imagePublicId: string;
  images: string[];
}

const emptyForm: ProjectFormState = {
  title: "",
  slug: "",
  description: "",
  longDescription: "",
  codeSnippet: "",
  technologies: [],
  liveUrl: "",
  githubUrl: "",
  accentColor: "primary",
  status: "completed",
  order: 0,
  isFeatured: false,
  isVisible: true,
  isSourceCodeVisible: false,
  image: "",
  imagePublicId: "",
  images: [],
};

// =============================================================================
// Helpers
// =============================================================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return "just now";
}

// =============================================================================
// Sub-components
// =============================================================================

/** Toast notification */
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-md animate-slide-in ${
        type === "success"
          ? "bg-green-500/15 border-green-500/30 text-green-400"
          : "bg-red-500/15 border-red-500/30 text-red-400"
      }`}
    >
      <span className="material-symbols-outlined text-lg">
        {type === "success" ? "check_circle" : "error"}
      </span>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  );
}

/** Delete confirmation dialog */
function DeleteDialog({
  projectTitle,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  projectTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card-dark border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-12 rounded-xl bg-red-500/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-red-400 text-2xl">
              warning
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Delete Project</h3>
            <p className="text-sm text-slate-400">This cannot be undone</p>
          </div>
        </div>
        <p className="text-slate-300 text-sm mb-6">
          Are you sure you want to delete{" "}
          <span className="font-bold text-white">
            &ldquo;{projectTitle}&rdquo;
          </span>
          ? This will permanently remove the project and all associated data.
        </p>
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm bg-white/5 border border-white/10 text-slate-300 rounded-lg hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {isDeleting && (
              <span className="material-symbols-outlined text-base animate-spin">
                progress_activity
              </span>
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/** Technology tag input */
function TechInput({
  technologies,
  onChange,
}: {
  technologies: string[];
  onChange: (techs: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const addTech = () => {
    const trimmed = input.trim();
    if (trimmed && !technologies.includes(trimmed)) {
      onChange([...technologies, trimmed]);
    }
    setInput("");
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Technologies
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {technologies.map((tech) => (
          <span
            key={tech}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-primary/10 border border-primary/20 rounded-lg text-primary"
          >
            {tech}
            <button
              onClick={() => onChange(technologies.filter((t) => t !== tech))}
              className="hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTech();
            }
          }}
          placeholder="Type and press Enter..."
          className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={addTech}
          className="px-3 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-lg hover:bg-white/10 transition-colors text-sm"
        >
          Add
        </button>
      </div>
    </div>
  );
}

/** Toggle switch */
function Toggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <div
      className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/8 transition-colors"
      onClick={() => onChange(!checked)}
    >
      <div>
        <span className="text-sm font-medium text-white">{label}</span>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <div
        className={`relative w-10 h-6 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-white/10"
        }`}
      >
        <div
          className={`absolute top-1 size-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

const ITEMS_PER_PAGE = 10;

export default function AdminProjectsPage() {
  // ── State ──────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormState>(emptyForm);
  const [autoSlug, setAutoSlug] = useState(true);
  const [deletingProject, setDeletingProject] = useState<{
    slug: string;
    title: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  // ── Queries & Mutations ────────────────────────────
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useAdminProjects(page, ITEMS_PER_PAGE);

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const projects = response?.data ?? [];
  const meta = response?.meta ?? {
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 1,
    hasMore: false,
  };

  // ── Derived ────────────────────────────────────────
  const statsTotal = meta.total;
  const statsFeatured = projects.filter((p) => p.isFeatured).length;
  const statsHidden = projects.filter((p) => !p.isVisible).length;
  const startItem = (meta.page - 1) * meta.limit + 1;
  const endItem = Math.min(meta.page * meta.limit, meta.total);
  const isSaving = createProject.isPending || updateProject.isPending;

  // ── Form helpers ───────────────────────────────────
  const updateField = useCallback(
    <K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) => {
      setForm((prev) => {
        const updated = { ...prev, [key]: value };
        if (key === "title" && autoSlug && !editingSlug) {
          updated.slug = generateSlug(value as string);
        }
        return updated;
      });
    },
    [autoSlug, editingSlug],
  );

  const openCreate = () => {
    setEditingSlug(null);
    setForm(emptyForm);
    setAutoSlug(true);
    setActiveTab("write");
    setDrawerOpen(true);
  };

  const openEdit = (project: ProjectData) => {
    setEditingSlug(project.slug);
    setForm({
      title: project.title,
      slug: project.slug,
      description: project.description,
      longDescription: project.longDescription || "",
      codeSnippet: project.codeSnippet || "",
      technologies: project.technologies || [],
      liveUrl: project.liveUrl || "",
      githubUrl: project.githubUrl || "",
      accentColor: project.accentColor || "primary",
      status: project.status || "completed",
      order: project.order,
      isFeatured: project.isFeatured ?? false,
      isVisible: project.isVisible ?? true,
      isSourceCodeVisible: project.isSourceCodeVisible ?? false,
      image: project.image || "",
      imagePublicId: "",
      images: project.images || [],
    });
    setAutoSlug(false);
    setActiveTab("write");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingSlug(null);
  };

  // ── Submit ──────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setToast({
        message: "Title and description are required",
        type: "error",
      });
      return;
    }

    try {
      // Auto-detect code blocks in longDescription on save
      const formattedLongDesc = autoDetectCodeBlocks(form.longDescription);

      if (editingSlug) {
        // Update
        const updateData: Partial<ProjectData> = {
          title: form.title,
          description: form.description,
          longDescription: formattedLongDesc || undefined,
          codeSnippet: form.codeSnippet || undefined,
          technologies: form.technologies,
          liveUrl: form.liveUrl || undefined,
          githubUrl: form.githubUrl || undefined,
          accentColor: form.accentColor,
          status: form.status,
          order: form.order,
          isFeatured: form.isFeatured,
          isVisible: form.isVisible,
          isSourceCodeVisible: form.isSourceCodeVisible,
          images: form.images,
        } as Partial<ProjectData>;
        updateData.image = form.image || "";

        await updateProject.mutateAsync({
          slug: editingSlug,
          data: updateData,
        });
        setToast({ message: "Project updated successfully", type: "success" });
      } else {
        // Create via FormData
        const formData = new FormData();
        formData.append("title", form.title);
        if (form.slug) formData.append("slug", form.slug);
        formData.append("description", form.description);
        if (formattedLongDesc)
          formData.append("longDescription", formattedLongDesc);
        if (form.codeSnippet) formData.append("codeSnippet", form.codeSnippet);
        if (form.liveUrl) formData.append("liveUrl", form.liveUrl);
        if (form.githubUrl) formData.append("githubUrl", form.githubUrl);
        formData.append("accentColor", form.accentColor);
        formData.append("status", form.status);
        formData.append("order", String(form.order));
        formData.append("isFeatured", String(form.isFeatured));
        formData.append("isVisible", String(form.isVisible));
        formData.append(
          "isSourceCodeVisible",
          String(form.isSourceCodeVisible),
        );
        if (form.technologies.length > 0) {
          formData.append("technologies", JSON.stringify(form.technologies));
        }
        if (form.image) {
          formData.append("image", form.image);
        }
        if (form.images && form.images.length > 0) {
          form.images.forEach((img) => {
            formData.append("images", img);
          });
        }
        await createProject.mutateAsync(formData);
        setToast({ message: "Project created successfully", type: "success" });
      }
      closeDrawer();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setToast({ message, type: "error" });
    }
  };

  // ── Delete ──────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingProject) return;
    try {
      await deleteProject.mutateAsync(deletingProject.slug);
      setToast({ message: "Project deleted successfully", type: "success" });
      setDeletingProject(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete project";
      setToast({ message, type: "error" });
    }
  };

  // ── Toggle visibility ──────────────────────────────
  const toggleVisibility = async (project: ProjectData) => {
    try {
      await updateProject.mutateAsync({
        slug: project.slug,
        data: { isVisible: !project.isVisible },
      });
      setToast({
        message: `Project ${project.isVisible ? "hidden" : "visible"}`,
        type: "success",
      });
    } catch {
      setToast({ message: "Failed to update visibility", type: "error" });
    }
  };

  // ── Image Upload ───────────────────────────────────
  const handleImageUpload = (result: UploadResult) => {
    setForm((prev) => ({
      ...prev,
      image: result.secureUrl,
      imagePublicId: result.publicId,
    }));
  };

  const handleImageRemove = () => {
    setForm((prev) => ({ ...prev, image: "", imagePublicId: "" }));
  };

  // ── Render ─────────────────────────────────────────
  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Projects</h2>
            <p className="text-slate-400 text-sm">
              Manage your portfolio projects
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <span
                className={`material-symbols-outlined text-lg ${isLoading ? "animate-spin" : ""}`}
              >
                refresh
              </span>
              Refresh
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined">add</span>
              New Project
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card-dark border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Total Projects</span>
              <span className="text-2xl font-bold text-white">
                {statsTotal}
              </span>
            </div>
          </div>
          <div className="bg-card-dark border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Featured</span>
              <span className="text-2xl font-bold text-yellow-400">
                {statsFeatured}
              </span>
            </div>
          </div>
          <div className="bg-card-dark border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Hidden</span>
              <span className="text-2xl font-bold text-slate-400">
                {statsHidden}
              </span>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center justify-between px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              Failed to load projects from server
            </div>
            <button
              onClick={() => refetch()}
              className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-xs font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="bg-card-dark border border-white/5 rounded-xl overflow-hidden">
            <div className="divide-y divide-white/5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-6">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="size-10 rounded-lg bg-white/5 animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-white/5 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-5 w-16 bg-white/5 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Table */}
        {!isLoading && projects.length > 0 && (
          <div className="bg-card-dark border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">
                    Project
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">
                    Image
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
                    key={project._id}
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
                          <p className="text-white font-medium">
                            {project.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            /{project.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {project.image ? (
                        <div className="w-20 h-14 rounded-lg overflow-hidden border border-white/10 relative">
                          <img
                            src={project.image}
                            alt={project.title}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-14 rounded-lg border border-dashed border-white/15 flex items-center justify-center text-slate-500">
                          <span className="material-symbols-outlined text-lg">
                            image
                          </span>
                        </div>
                      )}
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
                        {project.technologies.length > 3 && (
                          <span className="px-2 py-0.5 text-xs text-slate-500">
                            +{project.technologies.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <div className="flex flex-wrap gap-1 items-center">
                          {project.status === "ongoing" && (
                            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                              Ongoing
                            </span>
                          )}
                          {project.status === "completed" && (
                            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-green-500/10 text-green-400 rounded border border-green-500/20">
                              Completed
                            </span>
                          )}
                          {project.status === "on-hold" && (
                            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-amber-500/10 text-amber-400 rounded border border-amber-500/20">
                              On Hold
                            </span>
                          )}
                          {project.status === "archived" && (
                            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-slate-500/10 text-slate-400 rounded border border-slate-500/20">
                              Archived
                            </span>
                          )}
                          {project.isFeatured && (
                            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-yellow-500/10 text-yellow-400 rounded border border-yellow-500/20 flex items-center gap-1">
                              Featured
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${
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
                      {formatRelativeTime(project.updatedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(project)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                          title="Edit project"
                        >
                          <span className="material-symbols-outlined text-lg">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => toggleVisibility(project)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                          title={
                            project.isVisible ? "Hide project" : "Show project"
                          }
                        >
                          <span className="material-symbols-outlined text-lg">
                            {project.isVisible
                              ? "visibility"
                              : "visibility_off"}
                          </span>
                        </button>
                        <button
                          onClick={() =>
                            setDeletingProject({
                              slug: project.slug,
                              title: project.title,
                            })
                          }
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                          title="Delete project"
                        >
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
        )}

        {/* Pagination */}
        {projects.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Showing{" "}
              <span className="font-medium text-slate-200">
                {startItem}–{endItem}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-200">{meta.total}</span>{" "}
              projects
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-white/5 border border-white/10 text-slate-300 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-base">
                  chevron_left
                </span>
                Prev
              </button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (p === 1 || p === meta.totalPages) return true;
                  if (Math.abs(p - page) <= 1) return true;
                  return false;
                })
                .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1)
                    acc.push("ellipsis");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === "ellipsis" ? (
                    <span
                      key={`e-${i}`}
                      className="px-2 py-2 text-sm text-slate-500"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      className={`min-w-[36px] px-3 py-2 text-sm rounded-lg border transition-colors ${
                        page === item
                          ? "bg-primary text-black font-bold border-primary"
                          : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={!meta.hasMore}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-white/5 border border-white/10 text-slate-300 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
                <span className="material-symbols-outlined text-base">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && projects.length === 0 && (
          <div className="text-center py-16">
            <div className="size-20 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-slate-600">
                folder_off
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              No projects yet
            </h3>
            <p className="text-slate-400 mb-6">
              Create your first project to get started
            </p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined">add</span>
              New Project
            </button>
          </div>
        )}
      </div>

      {/* ═══════════ Slide-out Drawer ═══════════ */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
            onClick={closeDrawer}
          />

          {/* Drawer Panel */}
          <div className="fixed top-0 right-0 z-[80] h-full w-full max-w-xl bg-obsidian border-l border-white/10 shadow-2xl overflow-y-auto animate-slide-in-right">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-card-dark/90 backdrop-blur-md border-b border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingSlug ? "Edit Project" : "New Project"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingSlug
                    ? `Editing /${editingSlug}`
                    : "Fill in the details below"}
                </p>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="My Awesome Project"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                />
              </div>

              {/* Slug */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">
                    Slug
                  </label>
                  {!editingSlug && (
                    <button
                      onClick={() => setAutoSlug(!autoSlug)}
                      className="text-xs text-primary hover:underline"
                    >
                      {autoSlug ? "Edit manually" : "Auto-generate"}
                    </button>
                  )}
                </div>
                <input
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  disabled={autoSlug && !editingSlug}
                  placeholder="my-awesome-project"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Brief description of the project..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {form.description.length}/500
                </p>
              </div>

              {/* Long Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Long Description (Markdown)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const formatted = autoDetectCodeBlocks(
                        form.longDescription,
                      );
                      updateField("longDescription", formatted);
                      setToast({
                        message:
                          "Code blocks automatically detected and formatted!",
                        type: "success",
                      });
                    }}
                    className="text-xs flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-all font-semibold"
                    title="Automatically detect code snippets and wrap them in markdown backticks"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      magic_button
                    </span>
                    Auto-detect Code
                  </button>
                </div>

                {/* Tabs selector */}
                <div className="flex border-b border-white/10 gap-4 mb-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("write")}
                    className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                      activeTab === "write"
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                      activeTab === "preview"
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    Preview (Auto-detect)
                  </button>
                </div>

                {activeTab === "write" ? (
                  <textarea
                    value={form.longDescription}
                    onChange={(e) =>
                      updateField("longDescription", e.target.value)
                    }
                    placeholder="Detailed description for the project page... You can paste raw code snippets directly here."
                    rows={6}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 resize-y font-mono text-sm"
                  />
                ) : (
                  <div className="prose prose-invert prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 max-w-none text-slate-300 text-sm leading-relaxed max-h-[300px] overflow-y-auto border border-white/10 rounded-lg p-4 bg-white/[0.02]">
                    {form.longDescription.trim() ? (
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
                            const match = /language-(\w+)/.exec(
                              className || "",
                            );
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
                            <blockquote className="border-l-4 border-primary pl-4 py-1 italic bg-primary/5 text-slate-300 my-4">
                              {children}
                            </blockquote>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-lg font-black tracking-tight text-white mt-6 mb-3 flex items-center gap-2">
                              <span className="w-1 h-4 bg-primary inline-block" />
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-base font-bold tracking-tight text-white mt-4 mb-2 text-primary">
                              {children}
                            </h3>
                          ),
                          a: ({ children, href }) => (
                            <a
                              href={href}
                              className="text-primary hover:text-white underline decoration-primary/50 underline-offset-4 transition-colors font-semibold"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {autoDetectCodeBlocks(form.longDescription)}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-slate-500 italic text-center py-8">
                        Nothing to preview. Start writing to see the preview!
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Technologies */}
              <TechInput
                technologies={form.technologies}
                onChange={(techs) => updateField("technologies", techs)}
              />

              {/* URLs: side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Live URL
                  </label>
                  <input
                    value={form.liveUrl}
                    onChange={(e) => updateField("liveUrl", e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    GitHub URL
                  </label>
                  <input
                    value={form.githubUrl}
                    onChange={(e) => updateField("githubUrl", e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Accent Color, Status & Order */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Accent Color
                  </label>
                  <div className="flex gap-2">
                    {(["primary", "secondary"] as const).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateField("accentColor", color)}
                        className={`flex-1 py-2.5 rounded-lg border text-sm font-medium capitalize transition-all ${
                          form.accentColor === color
                            ? color === "primary"
                              ? "bg-primary/20 border-primary/40 text-primary"
                              : "bg-purple-500/20 border-purple-500/40 text-purple-400"
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Project Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      updateField(
                        "status",
                        e.target.value as ProjectFormState["status"],
                      )
                    }
                    className="w-full px-3 py-2.5 bg-[#161b22] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 appearance-none cursor-pointer"
                  >
                    <option value="ongoing" className="bg-obsidian text-white">
                      Ongoing
                    </option>
                    <option
                      value="completed"
                      className="bg-obsidian text-white"
                    >
                      Completed
                    </option>
                    <option value="on-hold" className="bg-obsidian text-white">
                      On Hold
                    </option>
                    <option value="archived" className="bg-obsidian text-white">
                      Archived
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) =>
                      updateField("order", parseInt(e.target.value) || 0)
                    }
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Project Image
                </label>
                <CloudinaryUpload
                  value={form.image || undefined}
                  publicId={form.imagePublicId || undefined}
                  folder="projects"
                  label="Upload Image"
                  onUpload={handleImageUpload}
                  onRemove={handleImageRemove}
                />
              </div>

              {/* Gallery Images */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">
                  Gallery Images
                </label>

                {form.images && form.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {form.images.map((imgUrl, index) => (
                      <div
                        key={index}
                        className="relative group rounded-xl overflow-hidden border border-white/10 aspect-video bg-obsidian"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgUrl}
                          alt={`Gallery image ${index + 1}`}
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              images: prev.images.filter(
                                (_, idx) => idx !== index,
                              ),
                            }));
                          }}
                          className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <CloudinaryUpload
                  folder="projects/gallery"
                  label="Add Gallery Image"
                  onUpload={(result) => {
                    setForm((prev) => ({
                      ...prev,
                      images: [...(prev.images || []), result.secureUrl],
                    }));
                    setToast({
                      message: "Image added to gallery!",
                      type: "success",
                    });
                  }}
                />
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <Toggle
                  label="Featured"
                  checked={form.isFeatured}
                  onChange={(v) => updateField("isFeatured", v)}
                  description="Show on homepage featured section"
                />
                <Toggle
                  label="Visible"
                  checked={form.isVisible}
                  onChange={(v) => updateField("isVisible", v)}
                  description="Publicly visible on the portfolio"
                />
                <Toggle
                  label="Source Code Visible"
                  checked={form.isSourceCodeVisible}
                  onChange={(v) => updateField("isSourceCodeVisible", v)}
                  description="Show GitHub repository link to users."
                />
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 bg-card-dark/90 backdrop-blur-md border-t border-white/5">
              <button
                onClick={closeDrawer}
                className="px-5 py-2.5 text-sm bg-white/5 border border-white/10 text-slate-300 rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-5 py-2.5 text-sm bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving && (
                  <span className="material-symbols-outlined text-base animate-spin">
                    progress_activity
                  </span>
                )}
                {editingSlug ? "Save Changes" : "Create Project"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation */}
      {deletingProject && (
        <DeleteDialog
          projectTitle={deletingProject.title}
          onConfirm={handleDelete}
          onCancel={() => setDeletingProject(null)}
          isDeleting={deleteProject.isPending}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Animations */}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
