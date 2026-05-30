"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Generate a stable browser fingerprint (no cookies, no localStorage).
 * Combines multiple browser signals into a single string that is
 * hashed server-side into SHA-256.
 *
 * This is NOT meant for cross-site tracking — it's purely for
 * deduplicating the same device on this one portfolio site.
 */
async function generateFingerprint(): Promise<string> {
  const components: string[] = [];

  // 1. Screen properties
  components.push(`${screen.width}x${screen.height}`);
  components.push(`${screen.colorDepth}`);
  components.push(`${window.devicePixelRatio || 1}`);

  // 2. Timezone
  try {
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    components.push(String(new Date().getTimezoneOffset()));
  }

  // 3. Language & platform
  components.push(navigator.language || "");
  components.push(navigator.platform || "");
  components.push(String(navigator.hardwareConcurrency || 0));
  components.push(String(navigator.maxTouchPoints || 0));

  // 4. Canvas fingerprint
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(50, 0, 80, 30);
      ctx.fillStyle = "#069";
      ctx.fillText("fingerprint", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("canvas", 4, 17);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch {
    components.push("no-canvas");
  }

  // 5. WebGL renderer
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        components.push(
          gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "",
        );
      }
    }
  } catch {
    components.push("no-webgl");
  }

  // 6. Available fonts probe (lightweight — check a few common ones)
  try {
    const testFonts = ["monospace", "sans-serif", "serif"];
    const span = document.createElement("span");
    span.style.position = "absolute";
    span.style.left = "-9999px";
    span.style.fontSize = "72px";
    span.textContent = "mmmmmmmmmmlli";
    document.body.appendChild(span);

    const widths = testFonts.map((font) => {
      span.style.fontFamily = font;
      return span.offsetWidth;
    });
    document.body.removeChild(span);
    components.push(widths.join(","));
  } catch {
    components.push("no-fonts");
  }

  return components.join("|");
}

/**
 * AnalyticsTracker — sends one tracking call per route change.
 * The server deduplicates by fingerprint hash, so even if the same
 * device visits 50 routes, it's still 1 Visitor document.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const fingerprintRef = useRef<string | null>(null);
  const sessionTrackedPaths = useRef<Set<string>>(new Set());

  // Generate fingerprint once on mount
  useEffect(() => {
    let cancelled = false;
    generateFingerprint().then((fp) => {
      if (!cancelled) fingerprintRef.current = fp;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Track on route change
  useEffect(() => {
    if (!pathname) return;

    // Don't track admin or API routes
    if (pathname.startsWith("/admin")) return;
    if (pathname.startsWith("/api")) return;

    // Debounce: don't re-track same path in the same session
    if (sessionTrackedPaths.current.has(pathname)) return;

    const trackHit = async () => {
      // Wait for fingerprint to be ready (with timeout)
      let attempts = 0;
      while (!fingerprintRef.current && attempts < 10) {
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }

      try {
        sessionTrackedPaths.current.add(pathname);

        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: pathname,
            referrer: document.referrer,
            fingerprint: fingerprintRef.current || "",
            screenResolution: `${screen.width}x${screen.height}`,
            language: navigator.language || "",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
          }),
        });
      } catch (error) {
        // Remove from tracked so it retries next navigation
        sessionTrackedPaths.current.delete(pathname);
        console.error("Analytics tracking failed:", error);
      }
    };

    // Small delay to ensure route transition is complete
    const timeoutId = setTimeout(trackHit, 300);
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}
