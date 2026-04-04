"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Welcome to the encrypted channel.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to initialize sub.");
      }
    } catch (_err) {
      setStatus("error");
      setMessage("Connection error. Try again later.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@domain.sys"
          required
          disabled={status === "loading"}
          className="bg-black border border-white/10 text-gray-300 placeholder:text-gray-700 focus:outline-none focus:border-[#00f0ff]/50 py-3 px-4 text-xs font-mono w-full transition-colors disabled:opacity-50"
        />
        {status === "loading" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className={`bg-[#0b1015] border border-[#00f0ff]/30 text-[#00f0ff] font-bold py-3 text-xs hover:bg-[#00f0ff]/10 transition-all uppercase tracking-widest w-full active:scale-[0.98] disabled:opacity-50`}
      >
        {status === "loading" ? "INITIALIZING..." : "INITIALIZE_SUB"}
      </button>

      {message && (
        <p
          className={`text-[10px] font-mono uppercase tracking-tighter ${status === "success" ? "text-green-500" : "text-red-500"}`}
        >
          {status === "success" ? ">> " : "!! "}
          {message}
        </p>
      )}
    </form>
  );
}
