"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

// =============================================================================
// Admin Auth Context
// Provides authentication state and methods for admin panel
// =============================================================================

interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  twoFactorEnabled: boolean;
}

interface AdminAuthContextValue {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: AdminUser) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/admin/login",
  "/admin/verify-2fa",
  "/admin/reset-password",
  "/admin/unauthorized",
];

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route);

  /**
   * Login - store tokens and user
   */
  const login = useCallback(
    (accessToken: string, refreshToken: string, userData: AdminUser) => {
      localStorage.setItem("admin-token", accessToken);
      localStorage.setItem("admin-refresh-token", refreshToken);
      setUser(userData);
    },
    [],
  );

  /**
   * Logout - clear tokens and redirect
   */
  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch {
      // Ignore errors
    }
    localStorage.removeItem("admin-token");
    localStorage.removeItem("admin-refresh-token");
    setUser(null);
    router.push("/admin/login");
  }, [router]);

  /**
   * Refresh session using refresh token
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem("admin-refresh-token");
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch("/api/admin/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("admin-token", data.accessToken);
        localStorage.setItem("admin-refresh-token", data.refreshToken);
        return true;
      }
    } catch {
      // Refresh failed
    }

    return false;
  }, []);

  /**
   * Verify session on mount
   */
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem("admin-token");

      if (!token) {
        setIsLoading(false);
        if (!isPublicRoute) {
          router.push("/admin/unauthorized");
        }
        return;
      }

      try {
        const response = await fetch("/api/admin/auth/session", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (data.success && data.user) {
          setUser(data.user);
        } else {
          // Try to refresh
          const refreshed = await refreshSession();
          if (refreshed) {
            // Retry session fetch
            const retryToken = localStorage.getItem("admin-token");
            const retryResponse = await fetch("/api/admin/auth/session", {
              headers: { Authorization: `Bearer ${retryToken}` },
            });
            const retryData = await retryResponse.json();
            if (retryData.success && retryData.user) {
              setUser(retryData.user);
            } else {
              if (!isPublicRoute) {
                router.push("/admin/unauthorized");
              }
            }
          } else {
            localStorage.removeItem("admin-token");
            localStorage.removeItem("admin-refresh-token");
            if (!isPublicRoute) {
              router.push("/admin/unauthorized");
            }
          }
        }
      } catch {
        if (!isPublicRoute) {
          router.push("/admin/unauthorized");
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, [pathname, isPublicRoute, router, refreshSession]);

  const value: AdminAuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshSession,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

/**
 * Hook to use admin auth context
 */
export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
