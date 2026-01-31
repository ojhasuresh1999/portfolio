import prisma from "@/lib/prisma";
import type { ServiceResult } from "../types";

/**
 * Blog Service
 * Handles all blog post-related database operations
 */
export class BlogService {
  /**
   * Get all published posts with pagination
   */
  async getPublished(options?: {
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<ServiceResult<{ items: unknown[]; total: number }>> {
    try {
      const page = options?.page ?? 1;
      const limit = Math.min(options?.limit ?? 10, 100);
      const skip = (page - 1) * limit;

      const where = {
        isPublished: true,
        ...(options?.category && { category: options.category }),
      };

      const [items, total] = await Promise.all([
        prisma.blogPost.findMany({
          where,
          skip,
          take: limit,
          orderBy: { publishedAt: "desc" },
        }),
        prisma.blogPost.count({ where }),
      ]);

      return { success: true, data: { items, total } };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch blog posts";
      return { success: false, error: message };
    }
  }

  /**
   * Get all posts (including drafts) - for admin
   */
  async getAll(options?: {
    page?: number;
    limit?: number;
  }): Promise<ServiceResult<{ items: unknown[]; total: number }>> {
    try {
      const page = options?.page ?? 1;
      const limit = Math.min(options?.limit ?? 10, 100);
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        prisma.blogPost.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.blogPost.count(),
      ]);

      return { success: true, data: { items, total } };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch blog posts";
      return { success: false, error: message };
    }
  }

  /**
   * Get a post by slug
   */
  async getBySlug(
    slug: string,
    publishedOnly = true,
  ): Promise<ServiceResult<unknown | null>> {
    try {
      const where = publishedOnly ? { slug, isPublished: true } : { slug };

      const post = await prisma.blogPost.findFirst({ where });
      return { success: true, data: post };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch blog post";
      return { success: false, error: message };
    }
  }

  /**
   * Get a post by ID
   */
  async getById(id: string): Promise<ServiceResult<unknown | null>> {
    try {
      const post = await prisma.blogPost.findUnique({
        where: { id },
      });
      return { success: true, data: post };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch blog post";
      return { success: false, error: message };
    }
  }

  /**
   * Get posts by category
   */
  async getByCategory(category: string): Promise<ServiceResult<unknown[]>> {
    try {
      const posts = await prisma.blogPost.findMany({
        where: { isPublished: true, category },
        orderBy: { publishedAt: "desc" },
      });
      return { success: true, data: posts };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch blog posts";
      return { success: false, error: message };
    }
  }

  /**
   * Get all categories with post count
   */
  async getCategories(): Promise<
    ServiceResult<{ category: string; count: number }[]>
  > {
    try {
      const categories = await prisma.blogPost.groupBy({
        by: ["category"],
        where: { isPublished: true },
        _count: { category: true },
      });

      const result = categories.map((c) => ({
        category: c.category,
        count: c._count.category,
      }));

      return { success: true, data: result };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch categories";
      return { success: false, error: message };
    }
  }

  /**
   * Create a new blog post
   */
  async create(data: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage?: string;
    category: string;
    tags?: string[];
    readTime?: number;
    isPublished?: boolean;
    publishedAt?: Date;
  }): Promise<ServiceResult<unknown>> {
    try {
      const post = await prisma.blogPost.create({ data });
      return { success: true, data: post };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create blog post";
      return { success: false, error: message };
    }
  }

  /**
   * Update a blog post
   */
  async update(
    id: string,
    data: Record<string, unknown>,
  ): Promise<ServiceResult<unknown>> {
    try {
      const post = await prisma.blogPost.update({
        where: { id },
        data,
      });
      return { success: true, data: post };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update blog post";
      return { success: false, error: message };
    }
  }

  /**
   * Delete a blog post
   */
  async delete(id: string): Promise<ServiceResult<unknown>> {
    try {
      const post = await prisma.blogPost.delete({
        where: { id },
      });
      return { success: true, data: post };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete blog post";
      return { success: false, error: message };
    }
  }

  /**
   * Publish a blog post
   */
  async publish(id: string): Promise<ServiceResult<unknown>> {
    return this.update(id, {
      isPublished: true,
      publishedAt: new Date(),
    });
  }

  /**
   * Unpublish a blog post
   */
  async unpublish(id: string): Promise<ServiceResult<unknown>> {
    return this.update(id, {
      isPublished: false,
    });
  }
}

// Singleton instance
export const blogService = new BlogService();
