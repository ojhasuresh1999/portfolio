"use client";

import { useState, useEffect } from "react";
import {
  useSettings,
  useUpdateSettings,
  useSocialLinks,
  useUpdateSocialLinks,
} from "@/hooks/queries";
// import CloudinaryUpload, {
//   type UploadResult,
// } from "@/components/ui/cloudinary-upload";

const getValidIcon = (iconStr: string) => {
  const i = iconStr.toLowerCase().trim();
  if (i === "github" || i === "git") return "code";
  if (i === "linkedin" || i === "linked") return "link";
  if (i === "twitter" || i === "x") return "tag";
  if (i === "email" || i === "mail" || i === "gmail") return "mail";
  if (i === "facebook" || i === "fb") return "thumb_up";
  if (i === "instagram" || i === "ig") return "photo_camera";
  if (i === "youtube" || i === "yt") return "play_circle";
  return i;
};

export default function AdminSettingsPage() {
  const { data: initialSettings, isLoading: isLoadingSettings } = useSettings();
  const updateSettings = useUpdateSettings();

  const { data: initialLinks, isLoading: isLoadingLinks } = useSocialLinks();
  const updateLinks = useUpdateSocialLinks();

  const [settings, setSettings] = useState({
    siteName: "",
    siteTagline: "",
    statusText: "",
    resumeUrl: "",
    metaTitle: "",
    metaDescription: "",
  });

  const [socialLinks, setSocialLinks] = useState<
    {
      platform: string;
      url: string;
      icon: string;
      order: number;
      isVisible: boolean;
    }[]
  >([]);

  const [saveStatus, setSaveStatus] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (initialSettings) {
      // eslint-disable-next-line
      setSettings({
        siteName: initialSettings.siteName || "",
        siteTagline: initialSettings.siteTagline || "",
        statusText: initialSettings.statusText || "",
        resumeUrl: initialSettings.resumeUrl || "",
        metaTitle: initialSettings.metaTitle || "",
        metaDescription: initialSettings.metaDescription || "",
      });
    }
  }, [initialSettings]);

  useEffect(() => {
    if (initialLinks) {
      // eslint-disable-next-line
      setSocialLinks(initialLinks);
    }
  }, [initialLinks]);

  const showToast = (message: string, type: "success" | "error") => {
    setSaveStatus({ message, type });
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync(settings);
      showToast("Settings saved successfully", "success");
    } catch {
      showToast("Failed to save settings", "error");
    }
  };

  const handleSaveLinks = async () => {
    try {
      await updateLinks.mutateAsync(socialLinks);
      showToast("Social links saved successfully", "success");
    } catch {
      showToast("Failed to save social links", "error");
    }
  };

  const addSocialLink = () => {
    setSocialLinks([
      ...socialLinks,
      {
        platform: "",
        url: "",
        icon: "link",
        order: socialLinks.length,
        isVisible: true,
      },
    ]);
  };

  const updateSocialLink = (
    index: number,
    field: string,
    value: string | boolean,
  ) => {
    const newLinks = [...socialLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setSocialLinks(newLinks);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  if (isLoadingSettings || isLoadingLinks) {
    return <div className="text-slate-400 p-8">Loading settings...</div>;
  }

  return (
    <div className="space-y-8 relative">
      {saveStatus && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-2 rounded-lg shadow-lg ${
            saveStatus.type === "success"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}
        >
          {saveStatus.message}
        </div>
      )}

      {/* Site Settings */}
      <div className="bg-card-dark border border-white/5 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            settings
          </span>
          Site Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Site Name
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) =>
                setSettings({ ...settings, siteName: e.target.value })
              }
              className="w-full px-4 py-3 bg-obsidian border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Tagline
            </label>
            <input
              type="text"
              value={settings.siteTagline}
              onChange={(e) =>
                setSettings({ ...settings, siteTagline: e.target.value })
              }
              className="w-full px-4 py-3 bg-obsidian border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Status Text
            </label>
            <input
              type="text"
              value={settings.statusText}
              onChange={(e) =>
                setSettings({ ...settings, statusText: e.target.value })
              }
              className="w-full px-4 py-3 bg-obsidian border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Meta Title (SEO)
            </label>
            <input
              type="text"
              value={settings.metaTitle}
              onChange={(e) =>
                setSettings({ ...settings, metaTitle: e.target.value })
              }
              className="w-full px-4 py-3 bg-obsidian border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Meta Description (SEO)
            </label>
            <textarea
              value={settings.metaDescription}
              rows={3}
              onChange={(e) =>
                setSettings({ ...settings, metaDescription: e.target.value })
              }
              className="w-full px-4 py-3 bg-obsidian border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={updateSettings.isPending}
            className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Resume Upload */}
      <div className="bg-card-dark border border-white/5 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            description
          </span>
          Resume Upload (PDF, DOC, DOCX)
        </h3>

        <div className="w-full">
          {settings.resumeUrl ? (
            <div className="p-4 border border-white/10 bg-white/5 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    check_circle
                  </span>
                  Resume uploaded successfully
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href={settings.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold text-primary hover:underline"
                  >
                    Open in New Tab
                  </a>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, resumeUrl: "" })}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {/* Inline preview via Google Docs Viewer */}
              <div className="w-full h-[60vh] rounded-lg overflow-hidden border border-white/10">
                <iframe
                  src={`https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(settings.resumeUrl)}&embedded=true`}
                  className="w-full h-full border-0 bg-white"
                  title="Resume Preview"
                />
              </div>
              <p className="text-xs text-slate-500 break-all">
                {settings.resumeUrl}
              </p>
            </div>
          ) : (
            <label className="relative w-full min-h-[10rem] rounded-xl border-2 border-dashed border-white/15 bg-obsidian hover:border-white/30 cursor-pointer flex flex-col items-center justify-center gap-3 p-6 transition-all">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white/5">
                <span className="material-symbols-outlined text-2xl text-slate-500">
                  upload_file
                </span>
              </div>
              <div className="text-center">
                <p className="text-sm text-white">
                  <span className="text-primary font-semibold">
                    Click to upload
                  </span>{" "}
                  your resume
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  PDF, DOC, DOCX up to 10MB
                </p>
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append("file", file);
                  formData.append("folder", "resumes");
                  try {
                    const headers: Record<string, string> = {};
                    if (typeof window !== "undefined") {
                      const token = localStorage.getItem("admin-token");
                      if (token) headers["Authorization"] = `Bearer ${token}`;
                    }
                    const resp = await fetch("/api/upload", {
                      method: "POST",
                      headers,
                      body: formData,
                    });
                    const json = await resp.json();
                    if (json.success) {
                      setSettings({
                        ...settings,
                        resumeUrl: json.data.secureUrl,
                      });
                    }
                  } catch (err) {
                    console.error("Upload failed", err);
                  }
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={updateSettings.isPending}
            className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {updateSettings.isPending ? "Saving..." : "Save Resume Changes"}
          </button>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-card-dark border border-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">
              share
            </span>
            Social Links
          </h3>
          <button
            onClick={addSocialLink}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">
              add_circle
            </span>
            Add Link
          </button>
        </div>

        <div className="space-y-4">
          {socialLinks.map((link, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-white/5 rounded-lg"
            >
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
                <span className="material-symbols-outlined text-lg">
                  {getValidIcon(link.icon)}
                </span>
              </div>

              <div className="flex-1 grid grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Platform (e.g. GitHub)"
                  value={link.platform}
                  onChange={(e) =>
                    updateSocialLink(index, "platform", e.target.value)
                  }
                  className="px-3 py-2 bg-obsidian border border-white/10 rounded-lg text-white text-sm focus:border-primary outline-none"
                />
                <input
                  type="text"
                  placeholder="Icon Name (e.g. code)"
                  value={link.icon}
                  onChange={(e) =>
                    updateSocialLink(index, "icon", e.target.value)
                  }
                  className="px-3 py-2 bg-obsidian border border-white/10 rounded-lg text-white text-sm focus:border-primary outline-none"
                />
                <input
                  type="url"
                  placeholder="URL"
                  value={link.url}
                  onChange={(e) =>
                    updateSocialLink(index, "url", e.target.value)
                  }
                  className="px-3 py-2 bg-obsidian border border-white/10 rounded-lg text-white text-sm focus:border-primary outline-none"
                />
              </div>

              <button
                onClick={() =>
                  updateSocialLink(index, "isVisible", !link.isVisible)
                }
                className={`p-2 rounded-lg transition-colors ${link.isVisible ? "text-green-400 hover:bg-green-400/10" : "text-slate-500 hover:bg-white/10"}`}
                title={link.isVisible ? "Visible" : "Hidden"}
              >
                <span className="material-symbols-outlined">
                  {link.isVisible ? "visibility" : "visibility_off"}
                </span>
              </button>

              <button
                onClick={() => removeSocialLink(index)}
                className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
          {socialLinks.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">
              No social links added yet.
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveLinks}
            disabled={updateLinks.isPending}
            className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {updateLinks.isPending ? "Saving..." : "Save Social Links"}
          </button>
        </div>
      </div>
    </div>
  );
}
