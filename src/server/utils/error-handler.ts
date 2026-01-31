import { NextResponse } from "next/server";
import * as z from "zod";
import { HttpStatus, ApiMessages } from "../constants";
import type { ApiResponse } from "../types";

// Dynamic import for Prisma to avoid build errors before generation
let Prisma: typeof import("@/generated/prisma").Prisma | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Prisma = require("@/generated/prisma").Prisma;
} catch {
  // Prisma not generated yet
}

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
 * Handle Prisma errors and convert to AppError
 */
export function handlePrismaError(error: unknown): AppError {
  if (!Prisma) {
    return AppError.internal("Database not configured");
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = error as InstanceType<
      typeof Prisma.PrismaClientKnownRequestError
    >;
    switch (prismaError.code) {
      case "P2002": {
        const target =
          (prismaError.meta?.target as string[])?.join(", ") ?? "field";
        return AppError.conflict(`Unique constraint failed on: ${target}`);
      }
      case "P2025":
        return AppError.notFound("Record not found");
      case "P2003":
        return AppError.badRequest("Foreign key constraint failed");
      case "P2014":
        return AppError.badRequest("Required relation not found");
      default:
        return AppError.internal(`Database error: ${prismaError.code}`);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return AppError.badRequest("Invalid data provided");
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return AppError.internal("Database connection failed");
  }

  return AppError.internal("An unexpected database error occurred");
}

/**
 * Check if error is a Prisma error
 */
function isPrismaError(error: unknown): boolean {
  if (!Prisma) return false;
  return (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError
  );
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

  // Prisma error
  if (isPrismaError(error)) {
    const appError = handlePrismaError(error);
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
