import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, AdminTokenPayload } from "./jwt.util";

// =============================================================================
// Auth Middleware Utilities
// Protect API routes requiring authentication
// =============================================================================

/**
 * Error response helper
 */
function errorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

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

/**
 * Require authentication middleware wrapper
 * Returns user payload or error response
 */
export function requireAuth(
  request: NextRequest,
): AdminTokenPayload | NextResponse {
  const payload = getAuthFromRequest(request);
  if (!payload) {
    return errorResponse("Unauthorized", 401);
  }
  return payload;
}

/**
 * Require admin role middleware
 */
export function requireAdmin(
  request: NextRequest,
): AdminTokenPayload | NextResponse {
  const result = requireAuth(request);
  if (result instanceof NextResponse) {
    return result;
  }

  if (result.role !== "ADMIN" && result.role !== "SUPER_ADMIN") {
    return errorResponse("Forbidden: Admin access required", 403);
  }

  return result;
}

/**
 * Rate limiting helper (simple in-memory implementation)
 * For production, use Redis-based rate limiting
 */
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

/**
 * Get client IP from request
 */
export function getClientIp(request: NextRequest): string {
  // Check common headers for proxied requests
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback
  return "unknown";
}
