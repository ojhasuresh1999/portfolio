"use client";

import { useEffect, useRef } from "react";
import axios from "axios";

const HEALTH_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes

export function SocketHealthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

    if (!socketUrl) {
      console.warn(
        "[SocketHealth] NEXT_PUBLIC_SOCKET_URL is not defined. Health check disabled.",
      );
      return;
    }

    const checkHealth = async () => {
      try {
        const response = await axios.get(`${socketUrl}/health`, {
          timeout: 5000,
        });
        console.log(
          `[SocketHealth] ${new Date().toLocaleTimeString()} - Status: ${response.data.status}`,
        );
      } catch (error) {
        console.error(
          `[SocketHealth] ${new Date().toLocaleTimeString()} - Connection failed:`,
          (error as Error).message,
        );
      }
    };

    // Initial check
    checkHealth();

    // Set up interval
    intervalRef.current = setInterval(checkHealth, HEALTH_CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return <>{children}</>;
}
