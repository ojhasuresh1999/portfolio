"use client";

import { useState, useRef } from "react";

// ============================================================================
// Types
// ============================================================================
interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type SubmitStatus = "idle" | "loading" | "success" | "error";

// ============================================================================
// Toast
// ============================================================================
function Toast({
  status,
  onClose,
}: {
  status: "success" | "error";
  onClose: () => void;
}) {
  return (
    <div
      className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-2xl backdrop-blur-md animate-slide-in max-w-sm ${
        status === "success"
          ? "bg-green-500/15 border-green-500/30 text-green-300"
          : "bg-red-500/15 border-red-500/30 text-red-300"
      }`}
    >
      <span className="material-symbols-outlined text-2xl shrink-0">
        {status === "success" ? "mark_email_read" : "error"}
      </span>
      <div>
        <p className="font-bold text-sm">
          {status === "success" ? "Message sent!" : "Failed to send"}
        </p>
        <p className="text-xs opacity-80 mt-0.5">
          {status === "success"
            ? "Check your inbox for a confirmation email."
            : "Please try again or contact me directly."}
        </p>
      </div>
      <button
        onClick={onClose}
        className="ml-2 opacity-60 hover:opacity-100 shrink-0"
      >
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  );
}

// ============================================================================
// FloatingLabel Input
// ============================================================================
function FloatingInput({
  id,
  type = "text",
  label,
  value,
  onChange,
  required,
}: {
  id: string;
  type?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        required={required}
        placeholder=" "
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="peer block w-full appearance-none rounded-lg border border-slate-600 bg-transparent px-3 pb-2.5 pt-5 text-sm text-white focus:border-primary focus:outline-none focus:ring-0 transition-colors"
      />
      <label
        htmlFor={id}
        className="absolute left-3 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-xs text-slate-400 duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-focus:top-4 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-primary"
      >
        {label}
      </label>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================
export function AboutContactForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [toast, setToast] = useState<"success" | "error" | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (type: "success" | "error") => {
    setToast(type);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    // Basic client-side validation
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim() || undefined,
          message: form.message.trim(),
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
        showToast("success");
      } else {
        setStatus("error");
        showToast("error");
      }
    } catch {
      setStatus("error");
      showToast("error");
    } finally {
      // Reset status after showing result
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const isLoading = status === "loading";

  return (
    <>
      {toast && <Toast status={toast} onClose={() => setToast(null)} />}

      <div className="relative bg-white/5 p-8 rounded-xl border border-slate-700/50 shadow-xl backdrop-blur-sm overflow-hidden group">
        {/* Meteor Effects */}
        {[
          { left: "10%", delay: "1s", duration: "4s" },
          { left: "70%", delay: "0.5s", duration: "6s" },
          { left: "40%", delay: "2.5s", duration: "3s" },
          { left: "90%", delay: "1.5s", duration: "5s" },
        ].map((meteor, i) => (
          <span
            key={i}
            className="absolute top-[-20px] w-0.5 h-0.5 bg-slate-500 shadow-[0_0_0_1px_rgba(255,255,255,0.1)] rotate-[215deg] animate-meteor"
            style={{
              left: meteor.left,
              animationDelay: meteor.delay,
              animationDuration: meteor.duration,
            }}
          />
        ))}

        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2 text-white">
            Let&apos;s Connect
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            Fill in the form and I&apos;ll reply to your inbox directly.
          </p>

          {/* Success State */}
          {status === "success" && (
            <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
              <span className="material-symbols-outlined text-2xl">
                check_circle
              </span>
              <div>
                <p className="font-bold text-sm">Message sent successfully!</p>
                <p className="text-xs opacity-75 mt-0.5">
                  Check your inbox for a confirmation email.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FloatingInput
                id="contact-name"
                label="Your Name"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                required
              />
              <FloatingInput
                id="contact-email"
                type="email"
                label="Email Address"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                required
              />
            </div>

            <FloatingInput
              id="contact-subject"
              label="Subject (optional)"
              value={form.subject}
              onChange={(v) => setForm({ ...form, subject: v })}
            />

            {/* Message */}
            <div className="relative">
              <textarea
                id="contact-message"
                required
                rows={4}
                placeholder=" "
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="peer block w-full appearance-none rounded-lg border border-slate-600 bg-transparent px-3 pb-2.5 pt-5 text-sm text-white focus:border-primary focus:outline-none focus:ring-0 resize-none transition-colors"
              />
              <label
                htmlFor="contact-message"
                className="absolute left-3 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-xs text-slate-400 duration-300 peer-placeholder-shown:top-5 peer-placeholder-shown:-translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-sm peer-focus:top-4 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-primary"
              >
                Message
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full relative overflow-hidden rounded-lg font-bold text-black py-4 bg-primary hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-xl animate-spin">
                    progress_activity
                  </span>
                  Sending...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl group-hover/btn:translate-x-1 transition-transform">
                    send
                  </span>
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
