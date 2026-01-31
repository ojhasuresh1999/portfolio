/**
 * HTTP Status Codes
 * Common HTTP status codes for API responses
 */
export const HttpStatus = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

/**
 * API Response Messages
 */
export const ApiMessages = {
  // Success
  SUCCESS: "Operation completed successfully",
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",

  // Errors
  NOT_FOUND: "Resource not found",
  BAD_REQUEST: "Invalid request data",
  UNAUTHORIZED: "Authentication required",
  FORBIDDEN: "Access denied",
  VALIDATION_ERROR: "Validation failed",
  INTERNAL_ERROR: "An unexpected error occurred",
  RATE_LIMITED: "Too many requests, please try again later",
  METHOD_NOT_ALLOWED: "Method not allowed",
} as const;

/**
 * Pagination Defaults
 */
export const Pagination = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Rate Limit Defaults
 */
export const RateLimit = {
  WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 minute
  MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  CONTACT_FORM_MAX: 5, // 5 submissions per window
} as const;

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;
