import prisma from "@/lib/prisma";
import type { ServiceResult } from "../types";

/**
 * Project Service
 * Handles all project-related database operations
 */
export class ProjectService {
  /**
   * Get all visible projects with pagination
   */
  async getAll(options?: {
    page?: number;
    limit?: number;
    featured?: boolean;
  }): Promise<ServiceResult<{ items: unknown[]; total: number }>> {
    try {
      const page = options?.page ?? 1;
      const limit = Math.min(options?.limit ?? 10, 100);
      const skip = (page - 1) * limit;

      const where = {
        isVisible: true,
        ...(options?.featured !== undefined && {
          isFeatured: options.featured,
        }),
      };

      const [items, total] = await Promise.all([
        prisma.project.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        }),
        prisma.project.count({ where }),
      ]);

      return { success: true, data: { items, total } };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch projects";
      return { success: false, error: message };
    }
  }

  /**
   * Get featured projects
   */
  async getFeatured(): Promise<ServiceResult<unknown[]>> {
    try {
      const projects = await prisma.project.findMany({
        where: { isVisible: true, isFeatured: true },
        orderBy: { order: "asc" },
      });
      return { success: true, data: projects };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch featured projects";
      return { success: false, error: message };
    }
  }

  /**
   * Get a project by slug
   */
  async getBySlug(slug: string): Promise<ServiceResult<unknown | null>> {
    try {
      const project = await prisma.project.findUnique({
        where: { slug },
      });
      return { success: true, data: project };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch project";
      return { success: false, error: message };
    }
  }

  /**
   * Get a project by ID
   */
  async getById(id: string): Promise<ServiceResult<unknown | null>> {
    try {
      const project = await prisma.project.findUnique({
        where: { id },
      });
      return { success: true, data: project };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch project";
      return { success: false, error: message };
    }
  }

  /**
   * Create a new project
   */
  async create(data: {
    title: string;
    slug: string;
    description: string;
    longDescription?: string;
    image?: string;
    codeSnippet?: string;
    technologies?: string[];
    liveUrl?: string | null;
    githubUrl?: string | null;
    accentColor?: string;
    order?: number;
    isFeatured?: boolean;
    isVisible?: boolean;
  }): Promise<ServiceResult<unknown>> {
    try {
      const project = await prisma.project.create({ data });
      return { success: true, data: project };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create project";
      return { success: false, error: message };
    }
  }

  /**
   * Update a project
   */
  async update(
    id: string,
    data: Partial<{
      title: string;
      slug: string;
      description: string;
      longDescription?: string;
      image?: string;
      codeSnippet?: string;
      technologies?: string[];
      liveUrl?: string | null;
      githubUrl?: string | null;
      accentColor?: string;
      order?: number;
      isFeatured?: boolean;
      isVisible?: boolean;
    }>,
  ): Promise<ServiceResult<unknown>> {
    try {
      const project = await prisma.project.update({
        where: { id },
        data,
      });
      return { success: true, data: project };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update project";
      return { success: false, error: message };
    }
  }

  /**
   * Delete a project
   */
  async delete(id: string): Promise<ServiceResult<unknown>> {
    try {
      const project = await prisma.project.delete({
        where: { id },
      });
      return { success: true, data: project };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete project";
      return { success: false, error: message };
    }
  }

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await prisma.project.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return true;
    return excludeId ? existing.id === excludeId : false;
  }
}

// Singleton instance
export const projectService = new ProjectService();
