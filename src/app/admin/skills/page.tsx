"use client";

import { useState, useEffect } from "react";
import {
  useSkills,
  useCreateSkill,
  useUpdateSkill,
  useDeleteSkill,
  type SkillData,
} from "@/hooks/queries/use-skills";
import {
  useTechStack,
  useCreateTechStack,
  useUpdateTechStack,
  useDeleteTechStack,
  type TechStackData,
} from "@/hooks/queries/use-tech-stack";

// =============================================================================
// Form States
// =============================================================================

interface SkillFormState {
  name: string;
  proficiency: number;
  category: "LANGUAGE" | "DATABASE" | "DEVOPS" | "FRAMEWORK" | "TOOL";
  order: number;
  isVisible: boolean;
}

const emptySkillForm: SkillFormState = {
  name: "",
  proficiency: 0,
  category: "LANGUAGE",
  order: 0,
  isVisible: true,
};

interface TechStackFormState {
  name: string;
  icon: string;
  color: string;
  order: number;
  isVisible: boolean;
}

const emptyTechStackForm: TechStackFormState = {
  name: "",
  icon: "",
  color: "",
  order: 0,
  isVisible: true,
};

const CATEGORIES = [
  { id: "LANGUAGE", name: "Languages", icon: "code" },
  { id: "DATABASE", name: "Databases", icon: "database" },
  { id: "DEVOPS", name: "DevOps", icon: "cloud_sync" },
  { id: "FRAMEWORK", name: "Frameworks/Libs", icon: "extension" },
  { id: "TOOL", name: "Tools", icon: "build" },
] as const;

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
            <h3 className="text-lg font-bold text-white">Delete Item</h3>
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
// Main Page Component
// =============================================================================

export default function AdminSkillsPage() {
  // ── Modals & Drawers State ─────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<"skill" | "techStack">("skill");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [skillForm, setSkillForm] = useState<SkillFormState>(emptySkillForm);
  const [techForm, setTechForm] =
    useState<TechStackFormState>(emptyTechStackForm);

  const [deletingItem, setDeletingItem] = useState<{
    id: string;
    title: string;
    type: "skill" | "techStack";
  } | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // ── Queries & Mutations ────────────────────────────
  const {
    data: skills = [],
    isLoading: loadingSkills,
    refetch: refetchSkills,
  } = useSkills(true);
  const {
    data: techStacks = [],
    isLoading: loadingTechs,
    refetch: refetchTechs,
  } = useTechStack(true);

  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const deleteSkill = useDeleteSkill();

  const createTechStack = useCreateTechStack();
  const updateTechStack = useUpdateTechStack();
  const deleteTechStack = useDeleteTechStack();

  const isLoading = loadingSkills || loadingTechs;
  const isSaving =
    createSkill.isPending ||
    updateSkill.isPending ||
    createTechStack.isPending ||
    updateTechStack.isPending;

  // ── Actions ─────────────────────────────────────────

  const openSkillForm = (skill?: SkillData, prefilledCategory?: string) => {
    setDrawerType("skill");
    if (skill) {
      setEditingId(skill._id);
      setSkillForm({
        name: skill.name,
        proficiency: skill.proficiency,
        category: skill.category,
        order: skill.order,
        isVisible: skill.isVisible,
      });
    } else {
      setEditingId(null);
      setSkillForm({
        ...emptySkillForm,
        category:
          (prefilledCategory as SkillFormState["category"]) ||
          emptySkillForm.category,
      });
    }
    setDrawerOpen(true);
  };

  const openTechStackForm = (techStack?: TechStackData) => {
    setDrawerType("techStack");
    if (techStack) {
      setEditingId(techStack._id);
      setTechForm({
        name: techStack.name,
        icon: techStack.icon,
        color: techStack.color,
        order: techStack.order,
        isVisible: techStack.isVisible,
      });
    } else {
      setEditingId(null);
      setTechForm(emptyTechStackForm);
    }
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setEditingId(null);
      setSkillForm(emptySkillForm);
      setTechForm(emptyTechStackForm);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (drawerType === "skill") {
        if (!skillForm.name) throw new Error("Name is required");

        if (editingId) {
          await updateSkill.mutateAsync({ id: editingId, data: skillForm });
          setToast({ message: "Skill updated successfully", type: "success" });
        } else {
          await createSkill.mutateAsync(skillForm);
          setToast({ message: "Skill created successfully", type: "success" });
        }
      } else {
        if (!techForm.name || !techForm.icon || !techForm.color)
          throw new Error("Name, Icon and Color are required");

        if (editingId) {
          await updateTechStack.mutateAsync({ id: editingId, data: techForm });
          setToast({
            message: "Tech element updated successfully",
            type: "success",
          });
        } else {
          await createTechStack.mutateAsync(techForm);
          setToast({
            message: "Tech element created successfully",
            type: "success",
          });
        }
      }
      closeDrawer();
    } catch (err: unknown) {
      const error = err as Error;
      setToast({ message: error.message || "Failed to save", type: "error" });
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      if (deletingItem.type === "skill") {
        await deleteSkill.mutateAsync(deletingItem.id);
      } else {
        await deleteTechStack.mutateAsync(deletingItem.id);
      }
      setToast({ message: "Deleted successfully", type: "success" });
    } catch (err: unknown) {
      const error = err as Error;
      setToast({ message: error.message || "Failed to delete", type: "error" });
    } finally {
      setDeletingItem(null);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refetchSkills(), refetchTechs()]);
    setToast({ message: "Data refreshed", type: "success" });
  };

  // ── Group Skills ────────────────────────────────────
  const groupedSkills = CATEGORIES.map((cat) => ({
    ...cat,
    skills: skills.filter((s) => s.category === cat.id),
  }));

  // ── Render ──────────────────────────────────────────
  return (
    <div className="space-y-6 relative">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {deletingItem && (
        <DeleteDialog
          title={deletingItem.title}
          onConfirm={handleDelete}
          onCancel={() => setDeletingItem(null)}
          isDeleting={deleteSkill.isPending || deleteTechStack.isPending}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Skills & Stack</h2>
          <p className="text-slate-400 text-sm">
            Manage your technical skills and proficiencies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            <span
              className={`material-symbols-outlined text-lg ${isLoading ? "animate-spin" : ""}`}
            >
              refresh
            </span>
          </button>
          <button
            onClick={() => openSkillForm()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
            Add Skill
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-white text-center py-20 flex flex-col items-center opacity-50">
          <span className="material-symbols-outlined text-4xl animate-spin mb-4">
            progress_activity
          </span>
          <p>Loading your technical knowledge center...</p>
        </div>
      ) : (
        <>
          {/* Categories */}
          <div className="space-y-6">
            {groupedSkills.map((category) => (
              <div
                key={category.id}
                className="bg-card-dark border border-white/5 rounded-xl overflow-hidden"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      {category.icon}
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      {category.name}
                    </h3>
                    <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                      {category.skills.length} skills
                    </span>
                  </div>
                  <button
                    onClick={() => openSkillForm(undefined, category.id)}
                    className="flex items-center gap-1 text-sm text-slate-400 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      add_circle
                    </span>
                    Add to {category.name}
                  </button>
                </div>

                {/* Skills List */}
                <div className="p-6 space-y-4">
                  {category.skills.length === 0 ? (
                    <p className="text-sm text-slate-600 text-center py-4">
                      No skills added yet to this category.
                    </p>
                  ) : (
                    category.skills.map((skill) => (
                      <div
                        key={skill._id}
                        className={`flex items-center gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group ${
                          !skill.isVisible ? "opacity-40 grayscale" : ""
                        }`}
                      >
                        {/* Skill Name */}
                        <div className="w-1/3 flex items-center gap-2">
                          <span className="text-white font-medium">
                            {skill.name}
                          </span>
                          {!skill.isVisible && (
                            <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30">
                              Hidden
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="flex-1">
                          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                              style={{ width: `${skill.proficiency}%` }}
                            />
                          </div>
                        </div>

                        {/* Proficiency */}
                        <div className="w-16 text-right">
                          <span className="text-primary font-bold">
                            {skill.proficiency}%
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openSkillForm(skill)}
                            className="p-1.5 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
                          >
                            <span className="material-symbols-outlined text-sm">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              setDeletingItem({
                                type: "skill",
                                title: skill.name,
                                id: skill._id,
                              })
                            }
                            className="p-1.5 hover:bg-red-500/10 rounded transition-colors text-slate-400 hover:text-red-400"
                          >
                            <span className="material-symbols-outlined text-sm">
                              delete
                            </span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tech Stack Section */}
          <div className="bg-card-dark border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">
                Technical Arsenal (Tech Stack)
              </h3>
              <button
                onClick={() => openTechStackForm()}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">
                  add_circle
                </span>
                Add Tech
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {techStacks.length === 0 && (
                <p className="text-slate-500 text-sm col-span-full">
                  No technologies added.
                </p>
              )}
              {techStacks.map((tech) => (
                <div
                  key={tech._id}
                  className={`relative p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center gap-2 hover:border-primary/30 transition-all group ${
                    !tech.isVisible
                      ? "opacity-30 grayscale hover:opacity-100 hover:grayscale-0"
                      : ""
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-3xl text-slate-400 transition-colors"
                    style={{ color: tech.color || "inherit" }}
                  >
                    {tech.icon}
                  </span>
                  <span className="text-xs font-medium text-slate-300 relative z-10">
                    {tech.name}
                  </span>

                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex transition-opacity bg-black/60 rounded">
                    <button
                      onClick={() => openTechStackForm(tech)}
                      className="p-1 text-slate-300 hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        edit
                      </span>
                    </button>
                    <button
                      onClick={() =>
                        setDeletingItem({
                          type: "techStack",
                          title: tech.name,
                          id: tech._id,
                        })
                      }
                      className="p-1 text-red-500 hover:text-red-400"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={closeDrawer}
          />
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-md bg-surface-dark h-full border-l border-white/10 shadow-2xl flex flex-col animate-slide-in"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">
                {editingId
                  ? `Edit ${drawerType === "skill" ? "Skill" : "Technology"}`
                  : `New ${drawerType === "skill" ? "Skill" : "Technology"}`}
              </h2>
              <button
                type="button"
                onClick={closeDrawer}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {drawerType === "skill" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Name
                    </label>
                    <input
                      required
                      value={skillForm.name}
                      onChange={(e) =>
                        setSkillForm({ ...skillForm, name: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/40"
                      placeholder="e.g. TypeScript"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Category
                    </label>
                    <select
                      value={skillForm.category}
                      onChange={(e) =>
                        setSkillForm({
                          ...skillForm,
                          category: e.target
                            .value as SkillFormState["category"],
                        })
                      }
                      className="w-full px-4 py-2 bg-card-dark border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/40"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Proficiency ({skillForm.proficiency}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={skillForm.proficiency}
                      onChange={(e) =>
                        setSkillForm({
                          ...skillForm,
                          proficiency: parseInt(e.target.value),
                        })
                      }
                      className="w-full accent-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Order
                    </label>
                    <input
                      type="number"
                      value={skillForm.order}
                      onChange={(e) =>
                        setSkillForm({
                          ...skillForm,
                          order: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/40"
                    />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skillForm.isVisible}
                      onChange={(e) =>
                        setSkillForm({
                          ...skillForm,
                          isVisible: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-white/10 text-primary focus:ring-primary/20 accent-primary"
                    />
                    <span className="text-slate-300 text-sm">
                      Visible on Public Page
                    </span>
                  </label>
                </>
              )}

              {drawerType === "techStack" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Name
                    </label>
                    <input
                      required
                      value={techForm.name}
                      onChange={(e) =>
                        setTechForm({ ...techForm, name: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/40"
                      placeholder="e.g. Serverless"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Material Icon Name{" "}
                      <a
                        href="https://fonts.google.com/icons"
                        target="_blank"
                        className="text-primary text-xs ml-1 underline"
                      >
                        Browse Icons
                      </a>
                    </label>
                    <input
                      required
                      value={techForm.icon}
                      onChange={(e) =>
                        setTechForm({ ...techForm, icon: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/40"
                      placeholder="e.g. memory, developer_board"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Color Hint{" "}
                      <span className="text-xs text-slate-500">
                        (hex or tailwind class)
                      </span>
                    </label>
                    <input
                      value={techForm.color}
                      onChange={(e) =>
                        setTechForm({ ...techForm, color: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/40"
                      placeholder="e.g. bg-primary or #00f2ff"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Order
                    </label>
                    <input
                      type="number"
                      value={techForm.order}
                      onChange={(e) =>
                        setTechForm({
                          ...techForm,
                          order: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/40"
                    />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={techForm.isVisible}
                      onChange={(e) =>
                        setTechForm({
                          ...techForm,
                          isVisible: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-white/10 text-primary focus:ring-primary/20 accent-primary"
                    />
                    <span className="text-slate-300 text-sm">
                      Visible on Public Page
                    </span>
                  </label>
                </>
              )}
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                type="button"
                onClick={closeDrawer}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                {isSaving && (
                  <span className="material-symbols-outlined text-base animate-spin">
                    progress_activity
                  </span>
                )}
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
