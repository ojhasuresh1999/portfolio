"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface QuickReply {
  id: string;
  title: string;
  content: string;
}

interface Config {
  slaHours: number;
  quickReplies: QuickReply[];
  tags: string[];
  autoReplyTemplateSubject: string;
  autoReplyTemplateBody: string;
}

export default function CRMSettings() {
  const [config, setConfig] = useState<Config>({
    slaHours: 24,
    quickReplies: [],
    tags: [],
    autoReplyTemplateSubject: "",
    autoReplyTemplateBody: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  // Local helper states for creating tags & quick replies
  const [newTag, setNewTag] = useState("");
  const [newReplyTitle, setNewReplyTitle] = useState("");
  const [newReplyContent, setNewReplyContent] = useState("");
  const [showAddNewReplyForm, setShowAddNewReplyForm] = useState(false);

  // 1. Fetch config settings
  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("admin-token");
      const res = await fetch("/api/admin/contacts/config", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setConfig(json.data);
        }
      }
    } catch (err) {
      console.error("Config fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // 2. Submit saved config
  const handleSaveConfig = async (updatedConfig: Config = config) => {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      const token = localStorage.getItem("admin-token");
      const res = await fetch("/api/admin/contacts/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updatedConfig),
      });

      if (res.ok) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (err) {
      console.error("Save config error:", err);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // Add tag locally and auto-save
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    const tagVal = newTag.trim().toLowerCase();
    if (config.tags.includes(tagVal)) {
      setNewTag("");
      return;
    }
    const updated = {
      ...config,
      tags: [...config.tags, tagVal],
    };
    setConfig(updated);
    setNewTag("");
    handleSaveConfig(updated);
  };

  // Remove tag locally and auto-save
  const handleRemoveTag = (tagToRemove: string) => {
    const updated = {
      ...config,
      tags: config.tags.filter((t) => t !== tagToRemove),
    };
    setConfig(updated);
    handleSaveConfig(updated);
  };

  // Add quick reply template locally and save
  const handleAddQuickReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyTitle.trim() || !newReplyContent.trim()) return;

    const newReplyObj: QuickReply = {
      id: `template_${Date.now()}`,
      title: newReplyTitle.trim(),
      content: newReplyContent.trim(),
    };

    const updated = {
      ...config,
      quickReplies: [...config.quickReplies, newReplyObj],
    };

    setConfig(updated);
    setNewReplyTitle("");
    setNewReplyContent("");
    setShowAddNewReplyForm(false);
    handleSaveConfig(updated);
  };

  // Remove quick reply template locally and save
  const handleRemoveQuickReply = (idToRemove: string) => {
    if (!confirm("Are you sure you want to delete this response template?"))
      return;

    const updated = {
      ...config,
      quickReplies: config.quickReplies.filter((qr) => qr.id !== idToRemove),
    };
    setConfig(updated);
    handleSaveConfig(updated);
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-4 min-h-[500px]">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">
          progress_activity
        </span>
        <p className="text-slate-400 text-sm font-mono">
          Loading CRM configurations...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Heading Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <Link
            href="/admin/contacts"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2"
          >
            <span className="material-symbols-outlined text-base">
              arrow_back
            </span>
            Back to dashboard
          </Link>
          <h2 className="text-xl font-bold text-white">
            CRM Helpdesk Settings
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure response times, tags, templates, and public contact
            auto-replies.
          </p>
        </div>
        <button
          onClick={() => handleSaveConfig()}
          disabled={isSaving}
          className="text-xs font-bold bg-primary text-black px-6 py-2.5 rounded-xl hover:bg-primary/95 transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <span className="material-symbols-outlined text-sm animate-spin">
                progress_activity
              </span>
              Saving...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">save</span>
              Save Configuration
            </>
          )}
        </button>
      </div>

      {/* Save Success Banner */}
      {saveStatus === "success" && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold p-3 rounded-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-base">
            check_circle
          </span>
          Configuration saved and synced successfully!
        </div>
      )}

      {saveStatus === "error" && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          Failed to save configuration settings.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: General Configuration */}
        <div className="md:col-span-1 space-y-6">
          {/* SLA Targets Config */}
          <div className="bg-card-dark border border-white/5 rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
              <span className="material-symbols-outlined text-sm">timer</span>
              SLA SLA-Breach Targets
            </h3>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block font-bold">
                Max Response Target (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={168}
                value={config.slaHours}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    slaHours: Math.max(1, parseInt(e.target.value) || 24),
                  })
                }
                className="w-full text-xs bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary font-mono"
              />
              <span className="text-[9px] text-slate-500 block leading-tight pt-1">
                Submissions open longer than this target hours with no replies
                will be flagged as SLA overdue breach warnings.
              </span>
            </div>
          </div>

          {/* Tag labels config */}
          <div className="bg-card-dark border border-white/5 rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
              <span className="material-symbols-outlined text-sm">sell</span>
              Global Tag Labels
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {config.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] font-bold bg-white/5 text-slate-300 border border-white/10 px-2 py-0.5 rounded-full flex items-center gap-1.5"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[10px]">
                      close
                    </span>
                  </button>
                </span>
              ))}
            </div>
            <form onSubmit={handleAddTag} className="flex gap-2">
              <input
                type="text"
                placeholder="New tag label..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="w-full text-[11px] bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="p-2 bg-primary text-black rounded-lg hover:bg-primary/95 text-xs flex items-center justify-center shrink-0 font-bold"
              >
                Add
              </button>
            </form>
          </div>
        </div>

        {/* Right Columns: Email Auto-Response Template & Quick Replies Templates */}
        <div className="md:col-span-2 space-y-6">
          {/* Public Auto-Reply script */}
          <div className="bg-card-dark border border-white/5 rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
              <span className="material-symbols-outlined text-sm">
                forward_to_inbox
              </span>
              Public Submitter Auto-Reply Email
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-bold">
                  Email Subject Template
                </label>
                <input
                  type="text"
                  placeholder="Subject line..."
                  value={config.autoReplyTemplateSubject}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      autoReplyTemplateSubject: e.target.value,
                    })
                  }
                  className="w-full text-xs bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-[10px] text-slate-400 block font-bold">
                    Email Body Message
                  </label>
                  <span className="text-[9px] text-slate-500 font-mono">
                    Interpolations: {"{{name}}"}, {"{{message}}"}
                  </span>
                </div>
                <textarea
                  rows={5}
                  placeholder="Message body..."
                  value={config.autoReplyTemplateBody}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      autoReplyTemplateBody: e.target.value,
                    })
                  }
                  className="w-full text-xs bg-black/40 border border-white/10 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-primary resize-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Quick reply templates */}
          <div className="bg-card-dark border border-white/5 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">
                  article
                </span>
                Support Quick-Reply Templates
              </h3>
              <button
                onClick={() => setShowAddNewReplyForm(!showAddNewReplyForm)}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">
                  {showAddNewReplyForm ? "remove" : "add"}
                </span>
                {showAddNewReplyForm ? "Cancel" : "Add Template"}
              </button>
            </div>

            {/* Template creator form */}
            {showAddNewReplyForm && (
              <form
                onSubmit={handleAddQuickReply}
                className="p-4 bg-black/30 border border-white/5 rounded-xl space-y-3"
              >
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">
                    Template Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Collaboration Offer"
                    value={newReplyTitle}
                    onChange={(e) => setNewReplyTitle(e.target.value)}
                    className="w-full text-xs bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] text-slate-400 uppercase font-bold">
                      Response Content
                    </label>
                    <span className="text-[9px] text-slate-500 font-mono">
                      Interpolates: {"{{name}}"}
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    placeholder="Type pre-written reply text..."
                    value={newReplyContent}
                    onChange={(e) => setNewReplyContent(e.target.value)}
                    className="w-full text-xs bg-black/50 border border-white/10 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-primary resize-none font-sans"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="text-[10px] font-bold bg-primary text-black px-4 py-1.5 rounded-lg hover:bg-primary/95 shadow-md"
                  >
                    Save Template
                  </button>
                </div>
              </form>
            )}

            {/* Configured template list */}
            <div className="space-y-3 divide-y divide-white/5">
              {config.quickReplies.length > 0 ? (
                config.quickReplies.map((qr) => (
                  <div
                    key={qr.id}
                    className="pt-3 first:pt-0 group flex justify-between items-start gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-200">
                        {qr.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-normal font-sans line-clamp-3">
                        {qr.content}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveQuickReply(qr.id)}
                      className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all shrink-0"
                    >
                      <span className="material-symbols-outlined text-base">
                        delete
                      </span>
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs italic py-2">
                  No quick reply templates created.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
