"use client";

import { useState } from "react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "DEV_IO",
    siteTagline: "Backend Developer Portfolio",
    statusText: "System Online",
    footerLatency: "12ms",
  });

  const [socialLinks] = useState([
    { platform: "GitHub", url: "https://github.com", icon: "code" },
    { platform: "LinkedIn", url: "https://linkedin.com", icon: "work" },
    { platform: "Email", url: "mailto:hello@example.com", icon: "mail" },
  ]);

  return (
    <div className="space-y-8">
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
              Footer Latency
            </label>
            <input
              type="text"
              value={settings.footerLatency}
              onChange={(e) =>
                setSettings({ ...settings, footerLatency: e.target.value })
              }
              className="w-full px-4 py-3 bg-obsidian border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors">
            Save Changes
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
          <button className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
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
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">{link.icon}</span>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={link.platform}
                  className="px-3 py-2 bg-obsidian border border-white/10 rounded-lg text-white text-sm focus:border-primary outline-none"
                />
                <input
                  type="url"
                  value={link.url}
                  className="px-3 py-2 bg-obsidian border border-white/10 rounded-lg text-white text-sm focus:border-primary outline-none"
                />
              </div>

              <button className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
        <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">warning</span>
          Danger Zone
        </h3>

        <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-lg border border-red-500/10">
          <div>
            <p className="text-white font-medium">Clear All Data</p>
            <p className="text-sm text-slate-400">
              This will reset all content to defaults. This action cannot be
              undone.
            </p>
          </div>
          <button className="px-4 py-2 bg-red-500/20 text-red-400 font-bold rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30">
            Reset Data
          </button>
        </div>
      </div>
    </div>
  );
}
