import { NextResponse } from "next/server";
import { HttpStatus, ApiMessages } from "../constants";
import type { ApiResponse, PaginatedResponse, ResponseMeta } from "../types";

/**
 * API Response Builder
 * Provides consistent response formatting across all API routes
 */
export class ApiResponseBuilder {
  /**
   * Success response (200)
   */
  static success<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
    return NextResponse.json(
      {
        success: true,
        data,
        message: message ?? ApiMessages.SUCCESS,
      },
      { status: HttpStatus.OK },
    );
  }

  /**
   * Created response (201)
   */
  static created<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
    return NextResponse.json(
      {
        success: true,
        data,
        message: message ?? ApiMessages.CREATED,
      },
      { status: HttpStatus.CREATED },
    );
  }

  /**
   * No content response (204)
   */
  static noContent(): NextResponse {
    return new NextResponse(null, { status: HttpStatus.NO_CONTENT });
  }

  /**
   * Paginated response
   */
  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
  ): NextResponse<PaginatedResponse<T>> {
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json(
      {
        success: true,
        data,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasMore,
        },
      },
      { status: HttpStatus.OK },
    );
  }

  /**
   * Error response
   */
  static error(
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    meta?: ResponseMeta,
  ): NextResponse<ApiResponse<null>> {
    return NextResponse.json(
      {
        success: false,
        error: message,
        ...(meta && { meta }),
      },
      { status: statusCode },
    );
  }

  /**
   * Bad request (400)
   */
  static badRequest(message?: string): NextResponse<ApiResponse<null>> {
    return this.error(
      message ?? ApiMessages.BAD_REQUEST,
      HttpStatus.BAD_REQUEST,
    );
  }

  /**
   * Unauthorized (401)
   */
  static unauthorized(message?: string): NextResponse<ApiResponse<null>> {
    return this.error(
      message ?? ApiMessages.UNAUTHORIZED,
      HttpStatus.UNAUTHORIZED,
    );
  }

  /**
   * Forbidden (403)
   */
  static forbidden(message?: string): NextResponse<ApiResponse<null>> {
    return this.error(message ?? ApiMessages.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  /**
   * Not found (404)
   */
  static notFound(message?: string): NextResponse<ApiResponse<null>> {
    return this.error(message ?? ApiMessages.NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  /**
   * Method not allowed (405)
   */
  static methodNotAllowed(): NextResponse<ApiResponse<null>> {
    return this.error(
      ApiMessages.METHOD_NOT_ALLOWED,
      HttpStatus.METHOD_NOT_ALLOWED,
    );
  }

  /**
   * Validation error (422)
   */
  static validationError(
    errors: string | string[],
  ): NextResponse<ApiResponse<null>> {
    const message = Array.isArray(errors) ? errors.join(", ") : errors;
    return this.error(message, HttpStatus.UNPROCESSABLE_ENTITY);
  }

  /**
   * Rate limited (429)
   */
  static rateLimited(
    retryAfterSeconds?: number,
  ): NextResponse<ApiResponse<null>> {
    const response = this.error(
      ApiMessages.RATE_LIMITED,
      HttpStatus.TOO_MANY_REQUESTS,
    );

    if (retryAfterSeconds) {
      response.headers.set("Retry-After", retryAfterSeconds.toString());
    }

    return response;
  }

  /**
   * Internal server error (500)
   */
  static internalError(message?: string): NextResponse<ApiResponse<null>> {
    return this.error(
      message ?? ApiMessages.INTERNAL_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

// Convenience alias
export const Api = ApiResponseBuilder;
