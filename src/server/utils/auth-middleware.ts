import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, AdminTokenPayload } from "./jwt.util";
import { checkRateLimit as checkRateLimitUtil } from "./rate-limit";
import { randomUUID } from "crypto";

// =============================================================================
// Auth Middleware Utilities
// Production-grade authentication & authorization for API routes
// =============================================================================

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Authenticated request context injected into protected route handlers
 */
export interface AuthContext {
  admin: AdminTokenPayload;
  requestId: string;
  ip: string;
}

/**
 * Authenticated route handler signature
 */
type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext & { params?: Record<string, string> },
) => Promise<NextResponse>;

/**
 * Route handler with optional route params (Next.js dynamic routes)
 */
type NextRouteHandler = (
  request: NextRequest,
  ctx?: { params?: Promise<Record<string, string>> },
) => Promise<NextResponse>;

// ─── Security Headers ──────────────────────────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

/**
 * Attach security headers + request ID to a response
 */
function applySecurityHeaders(
  response: NextResponse,
  requestId: string,
): NextResponse {
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

// ─── Error Helpers ──────────────────────────────────────────────────────────

function errorResponse(
  message: string,
  status: number,
  requestId: string,
): NextResponse {
  const res = NextResponse.json(
    {
      success: false,
      error: message,
      requestId,
    },
    { status },
  );
  return applySecurityHeaders(res, requestId);
}

// ─── IP Extraction ──────────────────────────────────────────────────────────

/**
 * Get client IP from request (supports proxies)
 */
export function getClientIp(request: NextRequest): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

// ─── Token Extraction & Verification ────────────────────────────────────────

/**
 * Extract and verify token from request
 */
export function getAuthFromRequest(
  request: NextRequest,
): AdminTokenPayload | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  return verifyAccessToken(token);
}

// ─── Legacy Helpers (backward compatibility for chat routes) ────────────────

/**
 * Require authentication — returns payload or error response
 */
export function requireAuth(
  request: NextRequest,
): AdminTokenPayload | NextResponse {
  const payload = getAuthFromRequest(request);
  if (!payload) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  return payload;
}

/**
 * Require admin role
 */
export function requireAdmin(
  request: NextRequest,
): AdminTokenPayload | NextResponse {
  const result = requireAuth(request);
  if (result instanceof NextResponse) {
    return result;
  }

  if (result.role !== "ADMIN" && result.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden: Admin access required" },
      { status: 403 },
    );
  }

  return result;
}

// ─── Higher-Order Function Wrappers (Production) ────────────────────────────

/**
 * withAuth — wraps a route handler with JWT authentication.
 *
 * Usage:
 * ```ts
 * export const POST = withAuth(async (request, { admin, requestId, ip }) => {
 *   // admin is the verified AdminTokenPayload
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withAuth(handler: AuthenticatedHandler): NextRouteHandler {
  return async (
    request: NextRequest,
    ctx?: { params?: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    const requestId = randomUUID();
    const ip = getClientIp(request);

    // Extract and verify token
    const payload = getAuthFromRequest(request);
    if (!payload) {
      return errorResponse(
        "Unauthorized: Valid access token required",
        401,
        requestId,
      );
    }

    // Resolve dynamic route params if present
    const params = ctx?.params ? await ctx.params : undefined;

    // Execute the handler
    const response = await handler(request, {
      admin: payload,
      requestId,
      ip,
      params,
    });

    return applySecurityHeaders(response, requestId);
  };
}

/**
 * withAdmin — wraps a route handler with JWT + admin role authorization.
 *
 * Usage:
 * ```ts
 * export const POST = withAdmin(async (request, { admin, requestId, ip }) => {
 *   // admin is guaranteed to have ADMIN or SUPER_ADMIN role
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withAdmin(handler: AuthenticatedHandler): NextRouteHandler {
  return async (
    request: NextRequest,
    ctx?: { params?: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    const requestId = randomUUID();
    const ip = getClientIp(request);

    // Extract and verify token
    const payload = getAuthFromRequest(request);
    console.log("🚀 ~ withAdmin ~ payload:", payload);
    if (!payload) {
      return errorResponse(
        "Unauthorized: Valid access token required",
        401,
        requestId,
      );
    }

    // Check admin role
    if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN") {
      return errorResponse("Forbidden: Admin access required", 403, requestId);
    }

    // Resolve dynamic route params if present
    const params = ctx?.params ? await ctx.params : undefined;

    // Execute the handler
    const response = await handler(request, {
      admin: payload,
      requestId,
      ip,
      params,
    });

    return applySecurityHeaders(response, requestId);
  };
}

/**
 * withRateLimit — wraps a route handler with per-IP rate limiting.
 *
 * Usage:
 * ```ts
 * export const POST = withRateLimit(handler, { prefix: "login", maxRequests: 5 });
 * ```
 */
export function withRateLimit(
  handler: NextRouteHandler,
  options?: { prefix?: string; maxRequests?: number; windowMs?: number },
): NextRouteHandler {
  return async (
    request: NextRequest,
    ctx?: { params?: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    const result = checkRateLimitUtil(request, options);

    if (result.isLimited) {
      const requestId = randomUUID();
      const res = errorResponse(
        "Too many requests. Please try again later.",
        429,
        requestId,
      );
      res.headers.set("Retry-After", result.retryAfterSeconds.toString());
      return res;
    }

    return handler(request, ctx);
  };
}

// ─── Legacy Rate Limit (backward compat for login route) ────────────────────

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  ip: string,
  maxRequests: number = 10,
  windowSeconds: number = 60,
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = `ratelimit:${ip}`;
  const current = rateLimitMap.get(key);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowSeconds * 1000,
    });
    return { allowed: true };
  }

  if (current.count >= maxRequests) {
    const retryAfter = Math.ceil((current.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  current.count++;
  return { allowed: true };
}
