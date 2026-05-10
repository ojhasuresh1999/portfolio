import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

// =============================================================================
// API Client Configuration - Axios Instance with Interceptors
// =============================================================================

/**
 * API Error Response Structure
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
}

/**
 * Create configured Axios instance
 */
const apiClient = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor - Add auth headers, logging
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add session token from localStorage if available (for guest chat)
    if (typeof window !== "undefined") {
      const sessionToken = localStorage.getItem("chat-session-token");
      if (sessionToken) {
        config.headers.set("X-Session-Token", sessionToken);
      }

      // Add admin token from localStorage if available
      const adminToken = localStorage.getItem("admin-token");
      if (adminToken) {
        config.headers.set("Authorization", `Bearer ${adminToken}`);
      }
    }

    // Log request in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("[API Request Error]", error.message);
    return Promise.reject(error);
  },
);

/**
 * Response Interceptor - Error handling, transform responses
 */
apiClient.interceptors.response.use(
  (response) => {
    // Return data directly for convenience
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    // Handle network errors
    if (!error.response) {
      console.error("[API Network Error]", error.message);
      return Promise.reject({
        success: false,
        error: "Network error. Please check your connection.",
      });
    }

    // Handle API errors
    const { status, data, config } = error.response;

    // Log error in development
    if (process.env.NODE_ENV === "development") {
      console.error(`[API Error ${status}]`, data?.error || error.message);
    }

    // Handle specific status codes
    if (status === 401) {
      // Check if this is an admin request
      const isAdminRequest = config.url?.includes("/admin/");
      const isAuthHeaderPresent = !!config.headers.get("Authorization");
      const isRefreshRequest = config.url?.includes("/admin/auth/refresh");

      if (
        (isAdminRequest || isAuthHeaderPresent) &&
        !isRefreshRequest &&
        typeof window !== "undefined"
      ) {
        const refreshToken = localStorage.getItem("admin-refresh-token");

        if (refreshToken) {
          // If we have a refresh token, try to get a new access token
          // We use axios directly to avoid interceptor loop
          return axios
            .post("/api/admin/auth/refresh", { refreshToken })
            .then((res) => {
              if (res.data.success) {
                const { accessToken, refreshToken: newRefreshToken } = res.data;
                localStorage.setItem("admin-token", accessToken);
                localStorage.setItem("admin-refresh-token", newRefreshToken);

                // Update original request headers and retry
                config.headers.set("Authorization", `Bearer ${accessToken}`);
                return apiClient(config);
              }
              throw new Error("Refresh failed");
            })
            .catch((refreshError) => {
              // Refresh failed, clear tokens and redirect if needed
              localStorage.removeItem("admin-token");
              localStorage.removeItem("admin-refresh-token");
              return Promise.reject({
                success: false,
                error: "Session expired. Please login again.",
                statusCode: 401,
                message: `Session expired. Please login again.${refreshError.message}`,
              });
            });
        }
      }

      // Handle generic 401 (e.g. guest chat)
      if (typeof window !== "undefined") {
        localStorage.removeItem("chat-session-token");
        localStorage.removeItem("chat-user-data");
      }
    }

    // Rate limiting
    if (status === 429) {
      console.warn("[API] Rate limited");
    }

    // Server error
    if (status === 500) {
      console.error("[API] Server error");
    }

    return Promise.reject({
      success: false,
      error: data?.error || "An unexpected error occurred",
      statusCode: status,
    });
  },
);

export { apiClient };
