import { NextResponse } from "next/server";
import * as z from "zod";
import mongoose from "mongoose";
import { HttpStatus, ApiMessages } from "../constants";
import type { ApiResponse } from "../types";

/**
 * Custom Application Error
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string): AppError {
    return new AppError(message, HttpStatus.BAD_REQUEST);
  }

  static unauthorized(message: string = ApiMessages.UNAUTHORIZED): AppError {
    return new AppError(message, HttpStatus.UNAUTHORIZED);
  }

  static forbidden(message: string = ApiMessages.FORBIDDEN): AppError {
    return new AppError(message, HttpStatus.FORBIDDEN);
  }

  static notFound(message: string = ApiMessages.NOT_FOUND): AppError {
    return new AppError(message, HttpStatus.NOT_FOUND);
  }

  static conflict(message: string): AppError {
    return new AppError(message, HttpStatus.CONFLICT);
  }

  static internal(message: string = ApiMessages.INTERNAL_ERROR): AppError {
    return new AppError(message, HttpStatus.INTERNAL_SERVER_ERROR, false);
  }
}

/**
 * Format Zod validation errors into readable messages
 */
export function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}

/**
 * Handle MongoDB/Mongoose errors and convert to AppError
 */
export function handleMongoError(error: unknown): AppError {
  // MongoDB duplicate key error
  if (
    error instanceof Error &&
    "code" in error &&
    (error as { code: number }).code === 11000
  ) {
    const mongoError = error as { keyPattern?: Record<string, unknown> };
    const field = mongoError.keyPattern
      ? Object.keys(mongoError.keyPattern).join(", ")
      : "field";
    return AppError.conflict(`Duplicate value for: ${field}`);
  }

  // Mongoose validation error
  if (error instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(error.errors).map((e) => e.message);
    return AppError.badRequest(messages.join(", "));
  }

  // Mongoose CastError (invalid ObjectId)
  if (error instanceof mongoose.Error.CastError) {
    return AppError.badRequest(`Invalid ${error.path}: ${error.value}`);
  }

  // Document not found
  if (
    error instanceof mongoose.Error.DocumentNotFoundError ||
    (error instanceof Error && error.message === "Record not found")
  ) {
    return AppError.notFound("Record not found");
  }

  // Connection error
  if (error instanceof mongoose.Error.MongooseServerSelectionError) {
    return AppError.internal("Database connection failed");
  }

  return AppError.internal("An unexpected database error occurred");
}

/**
 * Check if error is a Mongoose/MongoDB error
 */
function isMongoError(error: unknown): boolean {
  if (error instanceof mongoose.Error) return true;
  if (
    error instanceof Error &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "number"
  ) {
    return true;
  }
  return false;
}

/**
 * Central error handler for API routes
 * Converts various error types to appropriate API responses
 */
export function handleError(error: unknown): NextResponse<ApiResponse<null>> {
  // Already an AppError
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode },
    );
  }

  // Zod validation error
  if (error instanceof z.ZodError) {
    const messages = formatZodErrors(error);
    return NextResponse.json(
      { success: false, error: messages.join(", ") },
      { status: HttpStatus.UNPROCESSABLE_ENTITY },
    );
  }

  // MongoDB/Mongoose error
  if (isMongoError(error)) {
    const appError = handleMongoError(error);
    return NextResponse.json(
      { success: false, error: appError.message },
      { status: appError.statusCode },
    );
  }

  // Standard Error
  if (error instanceof Error) {
    // Log the actual error in development
    if (process.env.NODE_ENV === "development") {
      console.error("Unhandled error:", error);
    }
    return NextResponse.json(
      { success: false, error: ApiMessages.INTERNAL_ERROR },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }

  // Unknown error type
  return NextResponse.json(
    { success: false, error: ApiMessages.INTERNAL_ERROR },
    { status: HttpStatus.INTERNAL_SERVER_ERROR },
  );
}

/**
 * Async wrapper for route handlers with automatic error handling
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<T>>,
): Promise<NextResponse<T | ApiResponse<null>>> {
  return handler().catch((error) => handleError(error));
}
