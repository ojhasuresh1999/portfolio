"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Only track if we have a pathname and we are not in development
    // (You can remove the dev check if you want to test locally, but usually it's good practice to exclude local traffic)
    // For testing purposes during implementation, we will track in development.
    if (!pathname) return;

    // Do not track admin routes
    if (pathname.startsWith("/admin")) return;
    if (pathname.startsWith("/api")) return;

    const trackHit = async () => {
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: pathname,
            referrer: document.referrer,
          }),
        });
      } catch (error) {
        console.error("Analytics tracking failed:", error);
      }
    };

    // Small delay to ensure route transition is complete
    const timeoutId = setTimeout(trackHit, 500);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}
