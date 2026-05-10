"use client";

import { useState, useEffect } from "react";
import {
  useAboutContent,
  useUpdateAboutContent,
  useTimeline,
  useCreateTimelineEntry,
  useUpdateTimelineEntry,
  useDeleteTimelineEntry,
  type TimelineEntryData,
} from "@/hooks/queries/use-about";

// =============================================================================
// Sub-components
// =============================================================================

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

function DeleteDialog({
  title,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  title: string;
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
            <h3 className="text-lg font-bold text-white">Delete Entry</h3>
            <p className="text-sm text-slate-400">This cannot be undone</p>
          </div>
        </div>
        <p className="text-slate-300 text-sm mb-6">
          Are you sure you want to delete{" "}
          <span className="font-bold text-white">&ldquo;{title}&rdquo;</span>?
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
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Form State Types
// =============================================================================

interface AboutFormState {
  title: string;
  subtitle: string;
  description: string;
}

interface TimelineFormState {
  year: string;
  title: string;
  organizationName?: string;
  organizationUrl?: string;
  description: string;
  order: number;
  isVisible: boolean;
}

const emptyTimelineForm: TimelineFormState = {
  year: "",
  title: "",
  organizationName: "",
  organizationUrl: "",
  description: "",
  order: 0,
  isVisible: true,
};

// =============================================================================
// Main Admin About Page
// =============================================================================

export default function AdminAboutPage() {
  // ── About Content State ────────────────────────────
  const [aboutForm, setAboutForm] = useState<AboutFormState>({
    title: "",
    subtitle: "",
    description: "",
  });
  const [aboutDirty, setAboutDirty] = useState(false);

  // ── Timeline State ─────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [timelineForm, setTimelineForm] =
    useState<TimelineFormState>(emptyTimelineForm);
  const [deletingItem, setDeletingItem] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // ── Shared ─────────────────────────────────────────
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // ── Queries ────────────────────────────────────────
  const { data: aboutContent, isLoading: loadingAbout } = useAboutContent();
  const {
    data: timeline = [],
    isLoading: loadingTimeline,
    refetch: refetchTimeline,
  } = useTimeline(true);

  const updateAbout = useUpdateAboutContent();
  const createEntry = useCreateTimelineEntry();
  const updateEntry = useUpdateTimelineEntry();
  const deleteEntry = useDeleteTimelineEntry();

  const isLoading = loadingAbout || loadingTimeline;
  const isSavingAbout = updateAbout.isPending;
  const isSavingTimeline = createEntry.isPending || updateEntry.isPending;

  // ── Sync about form when data loads ───────────────
  useEffect(() => {
    if (aboutContent) {
      setAboutForm({
        title: aboutContent.title || "",
        subtitle: aboutContent.subtitle || "",
        description: aboutContent.description || "",
      });
      setAboutDirty(false);
    }
  }, [aboutContent]);

  // ── Handlers: About ───────────────────────────────
  const handleAboutChange = (field: keyof AboutFormState, value: string) => {
    setAboutForm((prev) => ({ ...prev, [field]: value }));
    setAboutDirty(true);
  };

  const handleAboutSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateAbout.mutateAsync({
        title: aboutForm.title,
        subtitle: aboutForm.subtitle,
        description: aboutForm.description,
      });
      setAboutDirty(false);
      setToast({
        message: "About content saved successfully",
        type: "success",
      });
    } catch {
      setToast({ message: "Failed to save about content", type: "error" });
    }
  };

  // ── Handlers: Timeline ────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setTimelineForm(emptyTimelineForm);
    setDrawerOpen(true);
  };

  const openEdit = (entry: TimelineEntryData) => {
    setEditingId(entry._id);
    setTimelineForm({
      year: entry.year,
      title: entry.title,
      organizationName: entry.organizationName || "",
      organizationUrl: entry.organizationUrl || "",
      description: entry.description,
      order: entry.order,
      isVisible: entry.isVisible,
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setEditingId(null);
      setTimelineForm(emptyTimelineForm);
    }, 200);
  };

  const handleTimelineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateEntry.mutateAsync({ id: editingId, data: timelineForm });
        setToast({ message: "Timeline entry updated", type: "success" });
      } else {
        await createEntry.mutateAsync({
          ...timelineForm,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Parameters<typeof createEntry.mutateAsync>[0]);
        setToast({ message: "Timeline entry created", type: "success" });
      }
      closeDrawer();
    } catch {
      setToast({ message: "Failed to save timeline entry", type: "error" });
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteEntry.mutateAsync(deletingItem.id);
      setToast({ message: "Timeline entry deleted", type: "success" });
    } catch {
      setToast({ message: "Failed to delete entry", type: "error" });
    } finally {
      setDeletingItem(null);
    }
  };

  // =============================================================================
  // Render
  // =============================================================================
  return (
    <div className="space-y-8 relative">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {deletingItem && (
        <DeleteDialog
          title={deletingItem.title}
          onConfirm={handleDelete}
          onCancel={() => setDeletingItem(null)}
          isDeleting={deleteEntry.isPending}
        />
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">About Page</h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage your biography, journey timeline, and public profile content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${
              isLoading
                ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                : "border-green-500/30 bg-green-500/10 text-green-400"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${isLoading ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`}
            />
            {isLoading ? "Loading..." : "Live"}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-40">
          <span className="material-symbols-outlined text-5xl animate-spin mb-4 text-white">
            progress_activity
          </span>
          <p className="text-white">Loading about content...</p>
        </div>
      ) : (
        <>
          {/* ── Section 1: Biography Editor ─────────────────── */}
          <form onSubmit={handleAboutSave}>
            <div className="bg-card-dark border border-white/5 rounded-2xl overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">
                      person
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Biography</h3>
                    <p className="text-xs text-slate-500">
                      Edit your public about section
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {aboutDirty && (
                    <span className="text-xs text-amber-400 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Unsaved changes
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isSavingAbout || !aboutDirty}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSavingAbout ? (
                      <span className="material-symbols-outlined text-base animate-spin">
                        progress_activity
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-base">
                        save
                      </span>
                    )}
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-300">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={aboutForm.title}
                    onChange={(e) => handleAboutChange("title", e.target.value)}
                    placeholder="More Than Just Code"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 transition-colors text-sm"
                  />
                </div>

                {/* Subtitle */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-300">
                    Subtitle / Label
                  </label>
                  <input
                    type="text"
                    value={aboutForm.subtitle}
                    onChange={(e) =>
                      handleAboutChange("subtitle", e.target.value)
                    }
                    placeholder="About Me"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 transition-colors text-sm"
                  />
                </div>

                {/* Resume URL — managed in global Settings */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-500/8 border border-blue-500/20">
                    <span className="material-symbols-outlined text-blue-400 text-xl shrink-0">
                      info
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-blue-300 font-medium">
                        Resume / CV is managed globally
                      </p>
                      <p className="text-xs text-blue-400/70 mt-0.5">
                        Upload or update your CV in{" "}
                        <a
                          href="/admin/settings"
                          className="underline hover:text-blue-300 transition-colors font-bold"
                        >
                          Settings → Resume Upload
                        </a>
                        . It will automatically appear on the About page.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">
                      Biography Description
                    </label>
                    <span className="text-xs text-slate-500">
                      {aboutForm.description.length} chars
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    required
                    value={aboutForm.description}
                    onChange={(e) =>
                      handleAboutChange("description", e.target.value)
                    }
                    placeholder="Tell your story — who you are, what you do, and what drives you..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 transition-colors text-sm resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Live Preview strip */}
              {aboutContent && (
                <div className="px-6 pb-6">
                  <div className="rounded-xl border border-dashed border-white/10 p-4 bg-white/2">
                    <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">
                        visibility
                      </span>
                      Current live content
                    </p>
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                      {aboutContent.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* ── Section 2: Timeline / Journey ──────────────── */}
          <div className="bg-card-dark border border-white/5 rounded-2xl overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-400 text-xl">
                    history_edu
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-white">My Journey</h3>
                  <p className="text-xs text-slate-500">
                    Timeline entries displayed on the about page
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetchTimeline()}
                  className="p-2 bg-white/5 border border-white/10 text-slate-400 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    refresh
                  </span>
                </button>
                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">
                    add
                  </span>
                  Add Entry
                </button>
              </div>
            </div>

            {/* Timeline List */}
            <div className="p-6">
              {timeline.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center gap-3 opacity-50">
                  <span className="material-symbols-outlined text-5xl text-slate-500">
                    timeline
                  </span>
                  <p className="text-slate-400 text-sm">
                    No timeline entries yet. Add your first milestone!
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[22px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-purple-500/30 to-transparent" />

                  <div className="space-y-3">
                    {timeline.map((entry) => (
                      <div
                        key={entry._id}
                        className={`relative flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/8 border border-white/5 hover:border-white/10 transition-all group ${
                          !entry.isVisible ? "opacity-40" : ""
                        }`}
                      >
                        {/* Timeline dot */}
                        <div className="relative z-10 size-[11px] rounded-full bg-primary border-2 border-slate-900 mt-1.5 shrink-0 ml-[16.5px]" />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold text-primary">
                                {entry.year}
                              </span>
                              <h4 className="font-bold text-white text-sm mt-0.5">
                                {entry.title}
                                {entry.organizationName && (
                                  <span className="text-slate-400 font-normal ml-2">
                                    @{" "}
                                    {entry.organizationUrl ? (
                                      <a
                                        href={entry.organizationUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-primary hover:underline transition-colors"
                                      >
                                        {entry.organizationName}
                                      </a>
                                    ) : (
                                      entry.organizationName
                                    )}
                                  </span>
                                )}
                              </h4>
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                {entry.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!entry.isVisible && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 border border-white/5">
                                  Hidden
                                </span>
                              )}
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500 border border-white/5">
                                Order: {entry.order}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => openEdit(entry)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                          >
                            <span className="material-symbols-outlined text-sm">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              setDeletingItem({
                                id: entry._id,
                                title: entry.title,
                              })
                            }
                            className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                          >
                            <span className="material-symbols-outlined text-sm">
                              delete
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Drawer: Timeline Entry Form ──────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          <form
            onSubmit={handleTimelineSubmit}
            className="relative w-full max-w-md bg-surface-dark h-full border-l border-white/10 shadow-2xl flex flex-col animate-slide-in"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingId ? "Edit Timeline Entry" : "New Timeline Entry"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingId
                    ? "Update this milestone in your journey"
                    : "Add a new milestone to your journey"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Year */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                  Year / Time Period
                </label>
                <input
                  required
                  value={timelineForm.year}
                  onChange={(e) =>
                    setTimelineForm({ ...timelineForm, year: e.target.value })
                  }
                  placeholder="e.g. 2024 - Present"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 text-sm"
                />
              </div>

              {/* Title */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                  Title / Role
                </label>
                <input
                  required
                  value={timelineForm.title}
                  onChange={(e) =>
                    setTimelineForm({ ...timelineForm, title: e.target.value })
                  }
                  placeholder="e.g. Senior Node.js Developer"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 text-sm"
                />
              </div>

              {/* Organization Name */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                  Organization / Company
                  <span className="text-slate-500 font-normal ml-1">
                    (Optional)
                  </span>
                </label>
                <input
                  value={timelineForm.organizationName || ""}
                  onChange={(e) =>
                    setTimelineForm({
                      ...timelineForm,
                      organizationName: e.target.value,
                    })
                  }
                  placeholder="e.g. Google, Remote, etc."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 text-sm"
                />
              </div>

              {/* Organization URL */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                  Organization Website
                  <span className="text-slate-500 font-normal ml-1">
                    (Optional)
                  </span>
                </label>
                <input
                  type="url"
                  value={timelineForm.organizationUrl || ""}
                  onChange={(e) =>
                    setTimelineForm({
                      ...timelineForm,
                      organizationUrl: e.target.value,
                    })
                  }
                  placeholder="e.g. https://google.com"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 text-sm"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={timelineForm.description}
                  onChange={(e) =>
                    setTimelineForm({
                      ...timelineForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe what you accomplished during this period..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 text-sm resize-none"
                />
              </div>

              {/* Order */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">
                  Display Order
                  <span className="text-slate-500 font-normal ml-1">
                    (lower = first)
                  </span>
                </label>
                <input
                  type="number"
                  value={timelineForm.order}
                  onChange={(e) =>
                    setTimelineForm({
                      ...timelineForm,
                      order: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/40 text-sm"
                />
              </div>

              {/* Visibility */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/8 transition-colors">
                <input
                  type="checkbox"
                  checked={timelineForm.isVisible}
                  onChange={(e) =>
                    setTimelineForm({
                      ...timelineForm,
                      isVisible: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-primary"
                />
                <div>
                  <span className="text-slate-300 text-sm font-medium">
                    Visible on public page
                  </span>
                  <p className="text-xs text-slate-500">
                    Uncheck to hide from visitors
                  </p>
                </div>
              </label>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                type="button"
                onClick={closeDrawer}
                disabled={isSavingTimeline}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingTimeline}
                className="flex-1 px-4 py-2.5 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {isSavingTimeline && (
                  <span className="material-symbols-outlined text-base animate-spin">
                    progress_activity
                  </span>
                )}
                {editingId ? "Save Changes" : "Create Entry"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
