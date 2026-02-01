import { connectToDatabase } from "@/lib/mongodb";
import type { Model, HydratedDocument } from "mongoose";
import type { PaginationOptions, ServiceResult } from "../types";
import { Pagination } from "../constants";

/**
 * Base Service with common CRUD operations for MongoDB
 * Extend this class to create entity-specific services
 *
 * Note: This is a simplified base service. For more complex use cases,
 * consider implementing entity-specific services directly.
 */
export abstract class BaseService<
  T,
  CreateInput extends object,
  UpdateInput extends object,
> {
  protected abstract getModel(): Model<T>;
  protected abstract readonly defaultOrderBy: Record<string, 1 | -1>;

  /**
   * Ensure database connection before any operation
   */
  protected async ensureConnection(): Promise<void> {
    await connectToDatabase();
  }

  /**
   * Find all records with pagination
   */
  async findAll(
    options?: PaginationOptions & { where?: Record<string, unknown> },
  ): Promise<ServiceResult<{ items: T[]; total: number }>> {
    try {
      await this.ensureConnection();

      const page = options?.page ?? Pagination.DEFAULT_PAGE;
      const limit = Math.min(
        options?.limit ?? Pagination.DEFAULT_LIMIT,
        Pagination.MAX_LIMIT,
      );
      const skip = (page - 1) * limit;
      const where = options?.where ?? {};

      const [items, total] = await Promise.all([
        this.getModel()
          .find(where)
          .skip(skip)
          .limit(limit)
          .sort(this.defaultOrderBy)
          .lean<T[]>()
          .exec(),
        this.getModel().countDocuments(where).exec(),
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
      await this.ensureConnection();
      const record = await this.getModel().findById(id).lean<T>().exec();
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
      await this.ensureConnection();
      const model = this.getModel();
      const doc = new model(data);
      const record = (await doc.save()) as HydratedDocument<T>;
      return { success: true, data: record.toObject() as T };
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
      await this.ensureConnection();
      const record = await this.getModel()
        .findByIdAndUpdate(id, data as Record<string, unknown>, {
          new: true,
          runValidators: true,
        })
        .lean<T>()
        .exec();

      if (!record) {
        return { success: false, error: "Record not found" };
      }

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
      await this.ensureConnection();
      const record = await this.getModel()
        .findByIdAndDelete(id)
        .lean<T>()
        .exec();

      if (!record) {
        return { success: false, error: "Record not found" };
      }

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
    await this.ensureConnection();
    const count = await this.getModel().countDocuments({ _id: id }).exec();
    return count > 0;
  }
}
