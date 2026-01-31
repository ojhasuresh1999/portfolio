import prisma from "@/lib/prisma";
import type { PaginationOptions, ServiceResult } from "../types";
import { Pagination } from "../constants";

// Type for Prisma model delegates
type PrismaModelName =
  | "user"
  | "heroContent"
  | "techStack"
  | "project"
  | "skill"
  | "skillCard"
  | "blogPost"
  | "timelineEntry"
  | "aboutContent"
  | "socialLink"
  | "siteSettings"
  | "contactSubmission";

/**
 * Base Service with common CRUD operations
 * Extend this class to create entity-specific services
 */
export abstract class BaseService<T, CreateInput, UpdateInput> {
  protected abstract readonly modelName: PrismaModelName;
  protected abstract readonly defaultOrderBy: Record<string, "asc" | "desc">;

  /**
   * Get the Prisma model delegate
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getModel(): any {
    return (prisma as unknown as Record<string, unknown>)[this.modelName];
  }

  /**
   * Find all records with pagination
   */
  async findAll(
    options?: PaginationOptions & { where?: Record<string, unknown> },
  ): Promise<ServiceResult<{ items: T[]; total: number }>> {
    try {
      const page = options?.page ?? Pagination.DEFAULT_PAGE;
      const limit = Math.min(
        options?.limit ?? Pagination.DEFAULT_LIMIT,
        Pagination.MAX_LIMIT,
      );
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        this.getModel().findMany({
          where: options?.where,
          skip,
          take: limit,
          orderBy: this.defaultOrderBy,
        }),
        this.getModel().count({ where: options?.where }),
      ]);

      return { success: true, data: { items, total } };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch records";
      return { success: false, error: message };
    }
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string): Promise<ServiceResult<T | null>> {
    try {
      const record = await this.getModel().findUnique({ where: { id } });
      return { success: true, data: record };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch record";
      return { success: false, error: message };
    }
  }

  /**
   * Create a new record
   */
  async create(data: CreateInput): Promise<ServiceResult<T>> {
    try {
      const record = await this.getModel().create({ data });
      return { success: true, data: record };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create record";
      return { success: false, error: message };
    }
  }

  /**
   * Update an existing record
   */
  async update(id: string, data: UpdateInput): Promise<ServiceResult<T>> {
    try {
      const record = await this.getModel().update({
        where: { id },
        data,
      });
      return { success: true, data: record };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update record";
      return { success: false, error: message };
    }
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<ServiceResult<T>> {
    try {
      const record = await this.getModel().delete({ where: { id } });
      return { success: true, data: record };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete record";
      return { success: false, error: message };
    }
  }

  /**
   * Check if a record exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.getModel().count({ where: { id } });
    return count > 0;
  }
}
