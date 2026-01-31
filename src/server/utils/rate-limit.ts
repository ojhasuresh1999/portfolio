import { NextRequest } from "next/server";
import { RateLimit as RateLimitConfig } from "../constants";

/**
 * Rate Limit Entry
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Simple in-memory rate limiter
 * Note: This is suitable for single-instance deployments.
 * For multi-instance deployments, use Redis-based rate limiting.
 */
class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Check if a request should be rate limited
   * @returns Object with isLimited flag and remaining requests
   */
  check(
    key: string,
    maxRequests: number = RateLimitConfig.MAX_REQUESTS,
    windowMs: number = RateLimitConfig.WINDOW_MS,
  ): { isLimited: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    // No existing entry or expired
    if (!entry || entry.resetAt <= now) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetAt: now + windowMs,
      };
      this.store.set(key, newEntry);
      return {
        isLimited: false,
        remaining: maxRequests - 1,
        resetAt: newEntry.resetAt,
      };
    }

    // Existing entry, increment count
    entry.count += 1;
    this.store.set(key, entry);

    const isLimited = entry.count > maxRequests;
    const remaining = Math.max(0, maxRequests - entry.count);

    return {
      isLimited,
      remaining,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Get client identifier from request
   */
  getClientKey(request: NextRequest, prefix = "global"): string {
    // Try to get real IP from various headers
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip");

    const ip =
      cfConnectingIp ||
      realIp ||
      forwardedFor?.split(",")[0]?.trim() ||
      "unknown";

    return `${prefix}:${ip}`;
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt <= now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Stop the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Global singleton instance
const globalRateLimiter = new RateLimiter();

export { globalRateLimiter as rateLimiter, RateLimiter };

/**
 * Rate limit check helper for route handlers
 */
export function checkRateLimit(
  request: NextRequest,
  options?: {
    prefix?: string;
    maxRequests?: number;
    windowMs?: number;
  },
): { isLimited: boolean; remaining: number; retryAfterSeconds: number } {
  const { prefix = "api", maxRequests, windowMs } = options ?? {};

  const key = globalRateLimiter.getClientKey(request, prefix);
  const result = globalRateLimiter.check(key, maxRequests, windowMs);

  const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);

  return {
    isLimited: result.isLimited,
    remaining: result.remaining,
    retryAfterSeconds: Math.max(0, retryAfterSeconds),
  };
}
