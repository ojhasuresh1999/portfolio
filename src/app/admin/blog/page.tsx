"use client";

import { useState, useEffect, useCallback } from "react";
import type { ComponentPropsWithoutRef } from "react";
import Image from "next/image";
import {
  useAdminBlogPosts,
  useCreateBlogPost,
  useUpdateBlogPost,
  useDeleteBlogPost,
  type BlogPostData,
} from "@/hooks/queries";
import CloudinaryUpload, {
  type UploadResult,
} from "@/components/ui/cloudinary-upload";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "@/components/mdx/CodeBlock";
import { autoDetectCodeBlocks } from "@/lib/code-detector";

// =============================================================================
// Types
// =============================================================================

interface BlogFormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  coverImagePublicId: string;
  images: string[];
  category: string;
  tags: string[];
  readTime: number;
  isPublished: boolean;
  isFeatured: boolean;
}

const EMPTY_FORM: BlogFormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  coverImagePublicId: "",
  images: [],
  category: "",
  tags: [],
  readTime: 5,
  isPublished: false,
  isFeatured: false,
};

// Common blog categories
const CATEGORIES = [
  "Engineering",
  "Performance",
  "Database",
  "Architecture",
  "DevOps",
  "Security",
  "Frontend",
  "Backend",
  "General",
];

// =============================================================================
// Helpers
// =============================================================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

// =============================================================================
// Component
// =============================================================================

export default function AdminBlogPage() {
  // ── State ──────────────────────────────────
  const [page, setPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<BlogFormState>(EMPTY_FORM);
  const [slugManual, setSlugManual] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogPostData | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  // ── Queries & Mutations ────────────────────
  const { data, isLoading, isError, error, refetch } = useAdminBlogPosts({
    page,
    limit: 10,
  });
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();

  const posts = data?.posts ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  // ── Auto-slug ──────────────────────────────
  useEffect(() => {
    if (!slugManual && form.title) {
      setForm((prev) => ({ ...prev, slug: generateSlug(prev.title) }));
    }
  }, [form.title, slugManual]);

  // ── Toast auto-dismiss ─────────────────────
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // ── Stats ──────────────────────────────────
  const published = posts.filter((p) => p.isPublished).length;
  const drafts = posts.filter((p) => !p.isPublished).length;
  const featuredCount = posts.filter((p) => p.isFeatured).length;

  // ── Handlers ───────────────────────────────
  const openNewDrawer = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingSlug(null);
    setSlugManual(false);
    setTagInput("");
    setActiveTab("write");
    setIsDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((post: BlogPostData) => {
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage || "",
      coverImagePublicId: "",
      images: post.images || [],
      category: post.category,
      tags: post.tags || [],
      readTime: post.readTime || 5,
      isPublished: post.isPublished,
      isFeatured: post.isFeatured || false,
    });
    setEditingSlug(post.slug);
    setSlugManual(true);
    setTagInput("");
    setActiveTab("write");
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingSlug(null);
  }, []);

  const handleImageUpload = useCallback((result: UploadResult) => {
    setForm((prev) => ({
      ...prev,
      coverImage: result.secureUrl,
      coverImagePublicId: result.publicId,
    }));
  }, []);

  const handleImageRemove = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      coverImage: "",
      coverImagePublicId: "",
    }));
  }, []);

  const addTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput("");
    }
  }, [tagInput, form.tags]);

  const removeTag = useCallback((tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  }, []);

  const handleSave = async () => {
    if (!form.title.trim() || !form.excerpt.trim() || !form.content.trim()) {
      setToast({
        message: "Title, excerpt, and content are required",
        type: "error",
      });
      return;
    }
    if (!form.category) {
      setToast({ message: "Category is required", type: "error" });
      return;
    }

    setSaving(true);
    try {
      // Auto-detect code blocks in content on save
      const formattedContent = autoDetectCodeBlocks(form.content);

      if (editingSlug) {
        // Update
        const updateData: Partial<BlogPostData> = {
          title: form.title,
          excerpt: form.excerpt,
          content: formattedContent,
          category: form.category,
          tags: form.tags,
          readTime: form.readTime,
          isPublished: form.isPublished,
          isFeatured: form.isFeatured,
          images: form.images,
        };
        if (form.coverImage) updateData.coverImage = form.coverImage;

        await updatePost.mutateAsync({ slug: editingSlug, data: updateData });
        setToast({ message: "Post updated successfully", type: "success" });
      } else {
        // Create
        await createPost.mutateAsync({
          title: form.title,
          slug: form.slug || undefined,
          excerpt: form.excerpt,
          content: formattedContent,
          coverImage: form.coverImage || undefined,
          images: form.images,
          category: form.category,
          tags: form.tags,
          readTime: form.readTime,
          isPublished: form.isPublished,
          isFeatured: form.isFeatured,
          publishedAt: form.isPublished ? new Date().toISOString() : undefined,
        } as Omit<BlogPostData, "_id" | "createdAt" | "updatedAt">);
        setToast({ message: "Post created successfully", type: "success" });
      }
      closeDrawer();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save post";
      setToast({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (post: BlogPostData) => {
    try {
      await updatePost.mutateAsync({
        slug: post.slug,
        data: {
          isPublished: !post.isPublished,
          ...(post.isPublished
            ? {}
            : { publishedAt: new Date().toISOString() }),
        },
      });
      setToast({
        message: post.isPublished ? "Post unpublished" : "Post published",
        type: "success",
      });
    } catch {
      setToast({ message: "Failed to toggle publish status", type: "error" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePost.mutateAsync(deleteTarget.slug);
      setToast({ message: "Post deleted successfully", type: "success" });
    } catch {
      setToast({ message: "Failed to delete post", type: "error" });
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Render ─────────────────────────────────
  return (
    <div className="space-y-6 relative">
      {/* ── Toast ─────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl text-sm font-medium shadow-2xl border backdrop-blur-md transition-all animate-[slideInRight_0.3s_ease-out] ${
            toast.type === "success"
              ? "bg-green-500/15 border-green-500/30 text-green-400"
              : "bg-red-500/15 border-red-500/30 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">
              {toast.type === "success" ? "check_circle" : "error"}
            </span>
            {toast.message}
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card-dark border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-xl">
                <span className="material-symbols-outlined text-red-400 text-2xl">
                  delete_forever
                </span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Delete Post</h3>
                <p className="text-slate-400 text-sm">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-6">
              Are you sure you want to delete{" "}
              <span className="text-white font-semibold">
                &ldquo;{deleteTarget.title}&rdquo;
              </span>
              ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white font-bold hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Blog Posts</h2>
          <p className="text-slate-400 text-sm">
            Manage your engineering chronicles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2.5 bg-card-dark border border-white/10 text-slate-300 rounded-xl hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Refresh
          </button>
          <button
            onClick={openNewDrawer}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">edit_note</span>
            New Post
          </button>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card-dark border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Posts</span>
            <span className="text-2xl font-bold text-white">
              {meta?.total ?? posts.length}
            </span>
          </div>
        </div>
        <div className="bg-card-dark border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Published</span>
            <span className="text-2xl font-bold text-green-400">
              {published}
            </span>
          </div>
        </div>
        <div className="bg-card-dark border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Drafts</span>
            <span className="text-2xl font-bold text-yellow-400">{drafts}</span>
          </div>
        </div>
        <div className="bg-card-dark border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Featured</span>
            <span className="text-2xl font-bold text-primary">
              {featuredCount}
            </span>
          </div>
        </div>
      </div>

      {/* ── Loading / Error ────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Loading posts…</p>
          </div>
        </div>
      )}

      {isError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <span className="material-symbols-outlined text-red-400 text-3xl mb-2">
            error
          </span>
          <p className="text-red-400 text-sm">
            {error instanceof Error ? error.message : "Failed to load posts"}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Table ──────────────────────────────── */}
      {!isLoading && !isError && (
        <div className="bg-card-dark border border-white/5 rounded-xl overflow-hidden">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">
                article
              </span>
              <p className="text-slate-400 font-medium">No blog posts yet</p>
              <p className="text-slate-500 text-sm mt-1">
                Create your first post to get started
              </p>
              <button
                onClick={openNewDrawer}
                className="mt-4 px-4 py-2 bg-primary text-black font-bold rounded-lg text-sm hover:bg-primary/90 transition-colors"
              >
                Create Post
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-semibold text-primary uppercase tracking-wider px-5 py-3">
                    Post
                  </th>
                  <th className="text-left text-xs font-semibold text-primary uppercase tracking-wider px-5 py-3">
                    Cover
                  </th>
                  <th className="text-left text-xs font-semibold text-primary uppercase tracking-wider px-5 py-3">
                    Category
                  </th>
                  <th className="text-left text-xs font-semibold text-primary uppercase tracking-wider px-5 py-3">
                    Tags
                  </th>
                  <th className="text-left text-xs font-semibold text-primary uppercase tracking-wider px-5 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-primary uppercase tracking-wider px-5 py-3">
                    Updated
                  </th>
                  <th className="text-right text-xs font-semibold text-primary uppercase tracking-wider px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post._id}
                    className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Title + slug */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-600">
                          article
                        </span>
                        <div>
                          <p className="text-white font-semibold text-sm">
                            {post.title}
                          </p>
                          <p className="text-slate-500 text-xs">/{post.slug}</p>
                        </div>
                      </div>
                    </td>
                    {/* Cover image */}
                    <td className="px-5 py-4">
                      {post.coverImage ? (
                        <div className="w-16 h-10 relative rounded-md overflow-hidden border border-white/10">
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                            placeholder="blur"
                            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-10 rounded-md border border-white/10 bg-white/5 flex items-center justify-center">
                          <span className="material-symbols-outlined text-slate-600 text-sm">
                            image
                          </span>
                        </div>
                      )}
                    </td>
                    {/* Category */}
                    <td className="px-5 py-4">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        {post.category}
                      </span>
                    </td>
                    {/* Tags */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(post.tags || []).slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs bg-white/5 text-slate-400 rounded border border-white/10"
                          >
                            {tag}
                          </span>
                        ))}
                        {(post.tags || []).length > 3 && (
                          <span className="text-xs text-slate-500">
                            +{post.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {post.isPublished ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            Draft
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Updated */}
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {relativeTime(post.updatedAt)}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditDrawer(post)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-lg">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => handleTogglePublish(post)}
                          className={`p-2 rounded-lg transition-colors ${
                            post.isPublished
                              ? "hover:bg-yellow-500/10 text-green-400 hover:text-yellow-400"
                              : "hover:bg-green-500/10 text-slate-400 hover:text-green-400"
                          }`}
                          title={post.isPublished ? "Unpublish" : "Publish"}
                        >
                          <span className="material-symbols-outlined text-lg">
                            {post.isPublished ? "visibility" : "visibility_off"}
                          </span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(post)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                          title="Delete"
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
          )}
        </div>
      )}

      {/* ── Pagination ─────────────────────────── */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          Showing{" "}
          <span className="text-white font-medium">
            {posts.length > 0 ? (page - 1) * 10 + 1 : 0}–
            {(page - 1) * 10 + posts.length}
          </span>{" "}
          of <span className="text-white font-medium">{meta?.total ?? 0}</span>{" "}
          posts
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined text-sm">
              chevron_left
            </span>
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? "bg-primary text-black"
                  : "border border-white/10 text-slate-400 hover:bg-white/5"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
          </button>
        </div>
      </div>

      {/* ── Slide-out Drawer ───────────────────── */}
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={closeDrawer}
          />

          {/* Drawer panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-obsidian border-l border-white/10 shadow-2xl flex flex-col animate-[slideInRight_0.25s_ease-out]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingSlug ? "Edit Post" : "New Post"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingSlug
                    ? `Editing: ${editingSlug}`
                    : "Create a new blog post"}
                </p>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* ── Basic Info ───────────────── */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                  Basic Info
                </h4>
                <div className="h-px bg-white/5" />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-primary/40 focus:border-primary/40 outline-none transition-all"
                  placeholder="My Amazing Blog Post"
                />
              </div>

              {/* Slug */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-slate-400">
                    Slug
                  </label>
                  {!editingSlug && (
                    <button
                      type="button"
                      onClick={() => setSlugManual((p) => !p)}
                      className="text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      {slugManual ? "Auto-generate" : "Edit manually"}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, slug: e.target.value }))
                  }
                  readOnly={!slugManual}
                  className={`w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-slate-600 outline-none transition-all ${
                    slugManual
                      ? "text-white focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
                      : "text-slate-500 cursor-default"
                  }`}
                  placeholder="auto-generated-slug"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  Category *
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, category: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary/40 outline-none transition-all appearance-none"
                >
                  <option value="" className="bg-obsidian text-slate-400">
                    Select a category
                  </option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-obsidian">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  Excerpt *
                </label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, excerpt: e.target.value }))
                  }
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-primary/40 focus:border-primary/40 outline-none transition-all resize-none"
                  placeholder="A brief summary of the post (max 500 chars)"
                  maxLength={500}
                />
                <p className="text-xs text-slate-600 mt-1 text-right">
                  {form.excerpt.length}/500
                </p>
              </div>

              {/* ── Content ──────────────────── */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                    Content
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const formatted = autoDetectCodeBlocks(form.content);
                      setForm((p) => ({ ...p, content: formatted }));
                      setToast({
                        message:
                          "Code blocks automatically detected and formatted!",
                        type: "success",
                      });
                    }}
                    className="text-xs flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-all font-semibold"
                    title="Automatically detect code snippets and wrap them in markdown backticks"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      magic_button
                    </span>
                    Auto-detect Code
                  </button>
                </div>
                <div className="h-px bg-white/5" />
              </div>

              {/* Tabs selector */}
              <div className="flex border-b border-white/10 gap-4 mb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("write")}
                  className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
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
                  className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === "preview"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  Preview (Live Auto-detect)
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "write" ? (
                <div>
                  <textarea
                    value={form.content}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, content: e.target.value }))
                    }
                    rows={12}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-mono placeholder:text-slate-600 focus:ring-2 focus:ring-primary/40 focus:border-primary/40 outline-none transition-all resize-y"
                    placeholder="Write your blog post... You can paste raw code snippets directly here. Click 'Auto-detect Code' above to format them into markdown automatically!"
                  />
                </div>
              ) : (
                <div className="prose prose-invert prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 max-w-none text-slate-300 text-sm leading-relaxed marker:text-primary max-h-[350px] overflow-y-auto border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                  {form.content.trim() ? (
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
                      {autoDetectCodeBlocks(form.content)}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-slate-500 italic text-center py-8">
                      Nothing to preview. Start writing to see the preview!
                    </p>
                  )}
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-white transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-primary/40 focus:border-primary/40 outline-none transition-all"
                    placeholder="Add a tag and press Enter"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Read Time */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  Read Time (minutes)
                </label>
                <input
                  type="number"
                  value={form.readTime}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      readTime: Math.max(1, parseInt(e.target.value) || 1),
                    }))
                  }
                  min="1"
                  className="w-32 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary/40 outline-none transition-all"
                />
              </div>

              {/* ── Media ────────────────────── */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                  Media
                </h4>
                <div className="h-px bg-white/5" />
              </div>

              {/* Cover Image */}
              <CloudinaryUpload
                value={form.coverImage || undefined}
                publicId={form.coverImagePublicId || undefined}
                folder="blog"
                label="Cover Image"
                onUpload={handleImageUpload}
                onRemove={handleImageRemove}
              />

              {/* Gallery Images */}
              <div className="space-y-3 mt-4">
                <label className="block text-sm font-medium text-slate-400">
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
                  folder="blog/gallery"
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

              {/* ── Status ───────────────────── */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                  Status
                </h4>
                <div className="h-px bg-white/5" />
              </div>

              {/* Published toggle */}
              <div className="flex items-center justify-between py-3 px-4 bg-white/[0.02] rounded-xl border border-white/5">
                <div>
                  <p className="text-sm font-medium text-white">Published</p>
                  <p className="text-xs text-slate-500">
                    Make this post visible to readers
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      isPublished: !p.isPublished,
                    }))
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    form.isPublished ? "bg-primary" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                      form.isPublished ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Featured toggle */}
              <div className="flex items-center justify-between py-3 px-4 bg-white/[0.02] rounded-xl border border-white/5 mt-3">
                <div>
                  <p className="text-sm font-medium text-white">Featured</p>
                  <p className="text-xs text-slate-500">
                    Display this post on the homepage
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      isFeatured: !p.isFeatured,
                    }))
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    form.isFeatured ? "bg-primary" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                      form.isFeatured ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                onClick={closeDrawer}
                className="px-5 py-2.5 text-sm rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {saving && (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                )}
                {editingSlug ? "Update Post" : "Create Post"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
