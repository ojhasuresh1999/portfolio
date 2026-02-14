import { NextRequest, NextResponse } from "next/server";

// =============================================================================
// Next.js Edge Middleware
// Lightweight route-level protection — runs BEFORE request reaches handlers
// =============================================================================

// Routes that require authentication for mutating methods
const PROTECTED_API_PATTERNS = [
  "/api/projects",
  "/api/blog",
  "/api/upload",
  "/api/settings",
];

// Methods that require authentication
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Public routes that never need auth (even for POST)
const PUBLIC_ROUTES = new Set([
  "/api/contact",
  "/api/health",
  "/api/admin/auth/login",
  "/api/admin/auth/refresh",
  "/api/admin/auth/recover",
  "/api/admin/auth/reset-password",
  "/api/admin/auth/verify-2fa",
  "/api/admin/auth/2fa/setup",
  "/api/chat/users",
  "/api/chat/conversations",
  "/api/chat/messages",
]);

// Security headers applied to ALL responses
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

/**
 * Check if the route requires authentication for this method
 */
function isProtectedRoute(pathname: string, method: string): boolean {
  // Skip if not a mutating method
  if (!MUTATING_METHODS.has(method)) return false;

  // Skip explicitly public routes
  if (PUBLIC_ROUTES.has(pathname)) return false;

  // Check if it matches a protected API pattern
  return PROTECTED_API_PATTERNS.some(
    (pattern) => pathname === pattern || pathname.startsWith(pattern + "/"),
  );
}

/**
 * Lightweight JWT presence check (no crypto, just structure validation)
 * Full verification happens in the route handler via withAdmin()
 */
function hasValidTokenStructure(authHeader: string | null): boolean {
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);
  if (!token || token.length < 10) return false;

  // JWT must have exactly 3 parts separated by dots
  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Generate a request ID for traceability
  const requestId = crypto.randomUUID();

  // Check if this route requires auth
  if (isProtectedRoute(pathname, method)) {
    const authHeader = request.headers.get("authorization");

    if (!hasValidTokenStructure(authHeader)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Bearer token required",
          requestId,
        },
        {
          status: 401,
          headers: {
            ...SECURITY_HEADERS,
            "X-Request-Id": requestId,
          },
        },
      );
    }
  }

  // Allow request to proceed — add security headers to response
  const response = NextResponse.next();

  // Apply security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  response.headers.set("X-Request-Id", requestId);

  // HSTS in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  return response;
}

// Only run middleware on API routes (skip static files, images, etc.)
export const config = {
  matcher: ["/api/:path*"],
};
