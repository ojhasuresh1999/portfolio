import type { HttpStatusCode } from "../constants";

/**
 * Standard API Response Structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: ResponseMeta;
}

/**
 * Response Metadata (for pagination, etc.)
 */
export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasMore?: boolean;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: Required<
    Pick<ResponseMeta, "page" | "limit" | "total" | "totalPages" | "hasMore">
  >;
}

/**
 * Service Result - Used internally by services
 */
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: HttpStatusCode };

/**
 * Pagination Options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Sort Options
 */
export interface SortOptions {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Query Options (combines pagination and sorting)
 */
export interface QueryOptions extends PaginationOptions, SortOptions {
  search?: string;
}

/**
 * ID Parameter
 */
export interface IdParam {
  id: string;
}

/**
 * Slug Parameter
 */
export interface SlugParam {
  slug: string;
}

/**
 * Request Context
 */
export interface RequestContext {
  ip?: string;
  userAgent?: string;
  userId?: string;
  isAuthenticated: boolean;
}

/**
 * Health Check Response
 */
export interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  environment: string;
  database: "connected" | "disconnected";
  uptime: number;
  version?: string;
}
