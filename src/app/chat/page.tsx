"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// =============================================================================
// Chat Page - Redirects to home with chat widget
// =============================================================================

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    // Trigger the chat widget to open via a custom event
    window.dispatchEvent(new CustomEvent("open-chat-widget"));
    // Redirect to home page
    router.push("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center">
      <div className="text-center">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">
          progress_activity
        </span>
        <p className="text-slate-400 mt-4 text-sm">Opening chat...</p>
      </div>
    </div>
  );
}
