"use client";

import { useState, useEffect, useRef, use } from "react";

// ============================================================================
// Types
// ============================================================================
interface EmailTemplateForm {
  subject: string;
  greeting: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  footerText: string;
  isActive: boolean;
}

const TEMPLATE_CONFIGS: Record<
  string,
  {
    title: string;
    desc: string;
    variables: { key: string; label: string }[];
  }
> = {
  contact_auto_reply: {
    title: "Contact Auto-Reply",
    desc: "Sent to the user when they submit a contact form.",
    variables: [
      { key: "{{name}}", label: "Sender's Name" },
      { key: "{{email}}", label: "Sender's Email" },
      { key: "{{subject}}", label: "Message Subject" },
      { key: "{{message}}", label: "Message Content" },
    ],
  },
  contact_admin_notice: {
    title: "Contact Admin Notice",
    desc: "Sent to you when a new contact form is submitted.",
    variables: [
      { key: "{{name}}", label: "Sender's Name" },
      { key: "{{email}}", label: "Sender's Email" },
      { key: "{{subject}}", label: "Message Subject" },
      { key: "{{message}}", label: "Message Content" },
    ],
  },
  chat_offline_user_notice: {
    title: "Chat Offline Notice",
    desc: "Sent to users who chat while you are offline.",
    variables: [{ key: "{{message}}", label: "Message Content" }],
  },
  chat_admin_notice: {
    title: "Chat Admin Notice",
    desc: "Sent to you when a new chat message arrives.",
    variables: [
      { key: "{{name}}", label: "Sender's Name" },
      { key: "{{message}}", label: "Message Content" },
    ],
  },
  subscribe_user_welcome: {
    title: "Subscriber Welcome",
    desc: "Sent to users when they subscribe to your blog.",
    variables: [],
  },
  subscribe_admin_notice: {
    title: "Subscriber Admin Notice",
    desc: "Sent to you when a new user subscribes.",
    variables: [{ key: "{{email}}", label: "Subscriber Email" }],
  },
  blog_newsletter: {
    title: "Blog Newsletter",
    desc: "Sent to subscribers when a new post is published.",
    variables: [
      { key: "{{blogTitle}}", label: "Blog Post Title" },
      { key: "{{blogExcerpt}}", label: "Blog Post Excerpt" },
      { key: "{{blogUrl}}", label: "Blog Post URL" },
      { key: "{{blogPath}}", label: "Blog Relative Path" },
    ],
  },
};

const DEFAULT_FORM: EmailTemplateForm = {
  subject: "Subject here...",
  greeting: "Hi {{name}},",
  body: "Message body...",
  ctaText: "Click Here",
  ctaUrl: "https://yourportfolio.com",
  footerText: "Automated message.",
  isActive: true,
};

// ============================================================================
// Preview renderer
// ============================================================================
function interpolate(tmpl: string, vars: Record<string, string>): string {
  return tmpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

function renderPreviewHtml(form: EmailTemplateForm): string {
  const vars = {
    name: "Alex Johnson",
    email: "alex@example.com",
    subject: "Exciting collaboration opportunity",
    message: "Hi! I would love to collaborate on a project with you.",
    blogTitle: "Next.js 15: What's New?",
    blogExcerpt: "A deep dive into the latest Next.js 15 features...",
    blogUrl: "https://yourportfolio.com/blog/nextjs-15",
    blogPath: "/blog/nextjs-15",
  };

  const resolvedGreeting = interpolate(form.greeting, vars);
  const resolvedBody = interpolate(form.body, vars);
  const resolvedCtaText = interpolate(form.ctaText, vars);
  const resolvedCtaUrl = form.ctaUrl || "https://yourportfolio.com";
  const resolvedFooter = interpolate(form.footerText, vars);

  const bodyHtml = resolvedBody
    .split("\n")
    .map((line) =>
      line.trim() === ""
        ? "<br>"
        : `<p style="margin:0 0 12px 0;color:#cbd5e1;font-size:15px;line-height:1.7;">${line}</p>`,
    )
    .join("");

  return `<!DOCTYPE html><html><body style="margin:0;padding:16px;background:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
  <tr><td style="background:linear-gradient(135deg,#0f172a,#1e1b4b);border-radius:16px 16px 0 0;padding:32px;text-align:center;border:1px solid rgba(99,102,241,0.2);border-bottom:none;">
    <div style="display:inline-block;background:rgba(0,240,255,0.1);border:1px solid rgba(0,240,255,0.3);border-radius:12px;padding:10px 18px;margin-bottom:16px;">
      <span style="font-family:monospace;font-size:16px;font-weight:900;letter-spacing:2px;color:#00f0ff;">SURESH</span>
    </div>
    <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff;">${interpolate(form.subject, vars)}</h1>
  </td></tr>
  <tr><td style="background:linear-gradient(90deg,#10b981,#059669);height:3px;border-left:1px solid rgba(99,102,241,0.2);border-right:1px solid rgba(99,102,241,0.2);"></td></tr>
  <tr><td style="background:#0f172a;padding:32px;border-left:1px solid rgba(99,102,241,0.2);border-right:1px solid rgba(99,102,241,0.2);">
    <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#e2e8f0;">${resolvedGreeting}</p>
    ${bodyHtml}
  </td></tr>
  <tr><td style="background:#0f172a;padding:0 32px 32px;text-align:center;border-left:1px solid rgba(99,102,241,0.2);border-right:1px solid rgba(99,102,241,0.2);">
    <a href="${resolvedCtaUrl}" style="display:inline-block;background:linear-gradient(135deg,#00f0ff,#6366f1);color:#000;text-decoration:none;font-weight:800;font-size:14px;padding:12px 32px;border-radius:10px;">
      ${resolvedCtaText} →
    </a>
  </td></tr>
  <tr><td style="background:#0f172a;padding:0 32px;border-left:1px solid rgba(99,102,241,0.2);border-right:1px solid rgba(99,102,241,0.2);">
    <div style="height:1px;background:rgba(255,255,255,0.06);"></div>
  </td></tr>
  <tr><td style="background:linear-gradient(135deg,#0f172a,#0a0f1e);border-radius:0 0 16px 16px;padding:24px 32px;border:1px solid rgba(99,102,241,0.2);border-top:none;">
    <p style="margin:0 0 6px;font-size:11px;color:#64748b;text-align:center;line-height:1.6;">${resolvedFooter}</p>
    <p style="margin:0;font-size:10px;color:#334155;text-align:center;">© ${new Date().getFullYear()} SURESH Portfolio</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

// ============================================================================
// Variable chip
// ============================================================================
function VarChip({ varKey, onClick }: { varKey: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] font-mono px-2 py-1 bg-primary/10 border border-primary/30 text-primary rounded-md hover:bg-primary/20 transition-colors"
    >
      {varKey}
    </button>
  );
}

// ============================================================================
// Main Page
// ============================================================================
export default function AdminEmailTemplatePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type: TEMPLATE_TYPE } = use(params);
  const [form, setForm] = useState<EmailTemplateForm>(DEFAULT_FORM);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [activeField, setActiveField] = useState<
    keyof EmailTemplateForm | null
  >(null);

  const textareaRefs = useRef<
    Partial<Record<keyof EmailTemplateForm, HTMLTextAreaElement | null>>
  >({});

  const config =
    TEMPLATE_CONFIGS[TEMPLATE_TYPE] || TEMPLATE_CONFIGS["contact_auto_reply"];

  // Load existing template
  useEffect(() => {
    const load = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("admin-token")
            : null;
        const res = await fetch(`/api/email-templates/${TEMPLATE_TYPE}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        if (json.success && json.data) {
          setForm({
            subject: json.data.subject || DEFAULT_FORM.subject,
            greeting: json.data.greeting || DEFAULT_FORM.greeting,
            body: json.data.body || DEFAULT_FORM.body,
            ctaText: json.data.ctaText || DEFAULT_FORM.ctaText,
            ctaUrl: json.data.ctaUrl || DEFAULT_FORM.ctaUrl,
            footerText: json.data.footerText || DEFAULT_FORM.footerText,
            isActive: json.data.isActive ?? true,
          });
        }
      } catch (e) {
        console.error("Failed to load template", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [TEMPLATE_TYPE]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleChange = (
    field: keyof EmailTemplateForm,
    value: string | boolean,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Insert variable at cursor position in the active textarea
  const insertVariable = (varKey: string) => {
    if (!activeField || activeField === "isActive") return;
    const el = textareaRefs.current[activeField];
    if (!el) {
      handleChange(activeField, (form[activeField] as string) + varKey);
      return;
    }
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const current = form[activeField] as string;
    const newValue = current.slice(0, start) + varKey + current.slice(end);
    handleChange(activeField, newValue);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + varKey.length, start + varKey.length);
    }, 0);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("admin-token")
          : null;
      const res = await fetch(`/api/email-templates/${TEMPLATE_TYPE}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setIsDirty(false);
        showToast("Email template saved successfully!", "success");
      } else {
        showToast(json.error || "Failed to save template", "error");
      }
    } catch {
      showToast("Failed to save template", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 opacity-40">
        <span className="material-symbols-outlined text-5xl animate-spin text-white mb-4">
          progress_activity
        </span>
        <p className="text-white">Loading template...</p>
      </div>
    );
  }

  const previewHtml = renderPreviewHtml(form);

  return (
    <div className="space-y-6 relative">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${
            toast.type === "success"
              ? "bg-green-500/15 border-green-500/30 text-green-400"
              : "bg-red-500/15 border-red-500/30 text-red-400"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{config.title}</h2>
          <p className="text-slate-400 text-sm mt-1">{config.desc}</p>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-xs text-amber-400 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
              Unsaved changes
            </span>
          )}
          <button
            form="email-template-form"
            type="submit"
            disabled={isSaving || !isDirty}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            {isSaving ? (
              <span className="material-symbols-outlined text-base animate-spin">
                progress_activity
              </span>
            ) : (
              <span className="material-symbols-outlined text-base">save</span>
            )}
            Save Template
          </button>
        </div>
      </div>

      {/* Variable Reference */}
      {config.variables.length > 0 && (
        <div className="bg-card-dark border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-lg">
              code
            </span>
            <h3 className="text-sm font-bold text-white">
              Available Variables
            </h3>
            <span className="text-xs text-slate-500">
              — Click to insert at cursor position
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.variables.map((v) => (
              <div key={v.key} className="flex items-center gap-1.5">
                <VarChip varKey={v.key} onClick={() => insertVariable(v.key)} />
                <span className="text-[11px] text-slate-500">{v.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Split: Editor + Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* === LEFT: Editor === */}
        <form
          id="email-template-form"
          onSubmit={handleSave}
          className="space-y-5"
        >
          {/* Active toggle */}
          <div className="bg-card-dark border border-white/5 rounded-xl p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-bold text-white">Template Active</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  When disabled, this email will not be sent automatically.
                </p>
              </div>
              <div
                className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? "bg-primary" : "bg-white/10"}`}
                onClick={() => handleChange("isActive", !form.isActive)}
              >
                <div
                  className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-7" : "translate-x-1"}`}
                />
              </div>
            </label>
          </div>

          {/* Subject */}
          <div className="bg-card-dark border border-white/5 rounded-xl p-5 space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Subject Line
            </label>
            <input
              type="text"
              required
              value={form.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              onFocus={() => setActiveField("subject")}
              placeholder="Thanks for reaching out, {{name}}!"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 text-sm transition-colors"
            />
          </div>

          {/* Greeting */}
          <div className="bg-card-dark border border-white/5 rounded-xl p-5 space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Greeting
            </label>
            <input
              type="text"
              value={form.greeting}
              onChange={(e) => handleChange("greeting", e.target.value)}
              onFocus={() => setActiveField("greeting")}
              placeholder="Hi {{name}},"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 text-sm transition-colors"
            />
          </div>

          {/* Body */}
          <div className="bg-card-dark border border-white/5 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">
                Email Body
              </label>
              <span className="text-xs text-slate-500">
                {form.body.length} chars
              </span>
            </div>
            <textarea
              required
              rows={7}
              value={form.body}
              onChange={(e) => handleChange("body", e.target.value)}
              onFocus={() => setActiveField("body")}
              ref={(el) => {
                textareaRefs.current.body = el;
              }}
              placeholder="Write your email body here. Use variables like {{name}}, {{message}}..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 text-sm resize-none leading-relaxed transition-colors font-mono"
            />
            <p className="text-xs text-slate-500">
              Each blank line becomes a paragraph break in the email.
            </p>
          </div>

          {/* CTA */}
          <div className="bg-card-dark border border-white/5 rounded-xl p-5 space-y-4">
            <p className="text-sm font-medium text-slate-300">
              Call-to-Action Button
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500">Button Text</label>
                <input
                  type="text"
                  value={form.ctaText}
                  onChange={(e) => handleChange("ctaText", e.target.value)}
                  onFocus={() => setActiveField("ctaText")}
                  placeholder="Visit My Portfolio"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 text-sm transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500">Button URL</label>
                <input
                  type="text"
                  value={form.ctaUrl}
                  onChange={(e) => handleChange("ctaUrl", e.target.value)}
                  onFocus={() => setActiveField("ctaUrl")}
                  placeholder="https://yourportfolio.com"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 text-sm transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-card-dark border border-white/5 rounded-xl p-5 space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Footer Text
            </label>
            <textarea
              rows={2}
              value={form.footerText}
              onChange={(e) => handleChange("footerText", e.target.value)}
              onFocus={() => setActiveField("footerText")}
              ref={(el) => {
                textareaRefs.current.footerText = el;
              }}
              placeholder="You'll typically hear from me within 24–48 hours..."
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 text-sm resize-none transition-colors"
            />
          </div>
        </form>

        {/* === RIGHT: Live Preview === */}
        <div className="sticky top-4 h-fit">
          <div className="bg-card-dark border border-white/5 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">
                  preview
                </span>
                <span className="text-sm font-bold text-white">
                  Live Preview
                </span>
                <span className="text-xs text-slate-500">
                  — using sample data
                </span>
              </div>
              <div className="flex gap-1.5">
                <span className="size-3 rounded-full bg-red-500/60" />
                <span className="size-3 rounded-full bg-yellow-500/60" />
                <span className="size-3 rounded-full bg-green-500/60" />
              </div>
            </div>
            <div className="p-3 bg-[#0a0f1e]">
              <iframe
                srcDoc={previewHtml}
                className="w-full rounded-lg border-0"
                style={{ height: "640px" }}
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
