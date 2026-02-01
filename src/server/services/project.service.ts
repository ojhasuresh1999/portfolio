import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/models";
import type { ServiceResult } from "../types";

// Return type for lean queries
interface ProjectDoc {
  _id: string;
  title: string;
  slug: string;
  description: string;
  longDescription?: string;
  image?: string;
  codeSnippet?: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
  accentColor: string;
  order: number;
  isFeatured: boolean;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project Service
 * Handles all project-related database operations
 */
export class ProjectService {
  /**
   * Ensure database connection before any operation
   */
  private async ensureConnection(): Promise<void> {
    await connectToDatabase();
  }

  /**
   * Get all visible projects with pagination
   */
  async getAll(options?: {
    page?: number;
    limit?: number;
    featured?: boolean;
  }): Promise<ServiceResult<{ items: ProjectDoc[]; total: number }>> {
    try {
      await this.ensureConnection();

      const page = options?.page ?? 1;
      const limit = Math.min(options?.limit ?? 10, 100);
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = { isVisible: true };
      if (options?.featured !== undefined) {
        where.isFeatured = options.featured;
      }

      const [items, total] = await Promise.all([
        Project.find(where)
          .skip(skip)
          .limit(limit)
          .sort({ order: 1, createdAt: -1 })
          .lean<ProjectDoc[]>()
          .exec(),
        Project.countDocuments(where).exec(),
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
  async getFeatured(): Promise<ServiceResult<ProjectDoc[]>> {
    try {
      await this.ensureConnection();

      const projects = await Project.find({ isVisible: true, isFeatured: true })
        .sort({ order: 1 })
        .lean<ProjectDoc[]>()
        .exec();

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
  async getBySlug(slug: string): Promise<ServiceResult<ProjectDoc | null>> {
    try {
      await this.ensureConnection();

      const project = await Project.findOne({ slug }).lean<ProjectDoc>().exec();
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
  async getById(id: string): Promise<ServiceResult<ProjectDoc | null>> {
    try {
      await this.ensureConnection();

      const project = await Project.findById(id).lean<ProjectDoc>().exec();
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
    liveUrl?: string;
    githubUrl?: string;
    accentColor?: string;
    order?: number;
    isFeatured?: boolean;
    isVisible?: boolean;
  }): Promise<ServiceResult<ProjectDoc>> {
    try {
      await this.ensureConnection();

      const project = await Project.create(data);
      const doc = project.toObject();
      return {
        success: true,
        data: { ...doc, _id: doc._id.toString() } as ProjectDoc,
      };
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
      liveUrl?: string;
      githubUrl?: string;
      accentColor?: string;
      order?: number;
      isFeatured?: boolean;
      isVisible?: boolean;
    }>,
  ): Promise<ServiceResult<ProjectDoc>> {
    try {
      await this.ensureConnection();

      const project = await Project.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      })
        .lean<ProjectDoc>()
        .exec();

      if (!project) {
        return { success: false, error: "Project not found" };
      }

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
  async delete(id: string): Promise<ServiceResult<ProjectDoc>> {
    try {
      await this.ensureConnection();

      const project = await Project.findByIdAndDelete(id)
        .lean<ProjectDoc>()
        .exec();

      if (!project) {
        return { success: false, error: "Project not found" };
      }

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
    await this.ensureConnection();

    const existing = await Project.findOne({ slug })
      .select("_id")
      .lean<{ _id: string }>()
      .exec();

    if (!existing) return true;
    return excludeId ? existing._id.toString() === excludeId : false;
  }
}

// Singleton instance
export const projectService = new ProjectService();
