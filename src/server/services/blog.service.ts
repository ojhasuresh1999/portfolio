import { connectToDatabase } from "@/lib/mongodb";
import { BlogPost } from "@/models";
import { subscriberService, emailService } from "./index";
import type { ServiceResult } from "../types";

// Return type for lean queries
interface BlogPostDoc {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string[];
  readTime: number;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Blog Service
 * Handles all blog post-related database operations
 */
export class BlogService {
  /**
   * Ensure database connection before any operation
   */
  private async ensureConnection(): Promise<void> {
    await connectToDatabase();
  }

  /**
   * Get all published posts with pagination
   */
  async getPublished(options?: {
    page?: number;
    limit?: number;
    category?: string;
    tag?: string;
  }): Promise<ServiceResult<{ items: BlogPostDoc[]; total: number }>> {
    try {
      await this.ensureConnection();

      const page = options?.page ?? 1;
      const limit = Math.min(options?.limit ?? 10, 100);
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = { isPublished: true };
      if (options?.category) {
        where.category = options.category;
      }
      if (options?.tag) {
        where.tags = options.tag;
      }

      const [items, total] = await Promise.all([
        BlogPost.find(where)
          .skip(skip)
          .limit(limit)
          .sort({ publishedAt: -1 })
          .lean<BlogPostDoc[]>()
          .exec(),
        BlogPost.countDocuments(where).exec(),
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
  }): Promise<ServiceResult<{ items: BlogPostDoc[]; total: number }>> {
    try {
      await this.ensureConnection();

      const page = options?.page ?? 1;
      const limit = Math.min(options?.limit ?? 10, 100);
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        BlogPost.find()
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean<BlogPostDoc[]>()
          .exec(),
        BlogPost.countDocuments().exec(),
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
  ): Promise<ServiceResult<BlogPostDoc | null>> {
    try {
      await this.ensureConnection();

      const where: Record<string, unknown> = { slug };
      if (publishedOnly) {
        where.isPublished = true;
      }

      const post = await BlogPost.findOne(where).lean<BlogPostDoc>().exec();
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
  async getById(id: string): Promise<ServiceResult<BlogPostDoc | null>> {
    try {
      await this.ensureConnection();
      const post = await BlogPost.findById(id).lean<BlogPostDoc>().exec();
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
  async getByCategory(category: string): Promise<ServiceResult<BlogPostDoc[]>> {
    try {
      await this.ensureConnection();

      const posts = await BlogPost.find({ isPublished: true, category })
        .sort({ publishedAt: -1 })
        .lean<BlogPostDoc[]>()
        .exec();

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
      await this.ensureConnection();

      const categories = await BlogPost.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $project: { category: "$_id", count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]).exec();

      return { success: true, data: categories };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch categories";
      return { success: false, error: message };
    }
  }

  /**
   * Get all tags with post count
   */
  async getTags(): Promise<ServiceResult<{ tag: string; count: number }[]>> {
    try {
      await this.ensureConnection();

      const tags = await BlogPost.aggregate([
        {
          $match: {
            isPublished: true,
            tags: { $exists: true, $not: { $size: 0 } },
          },
        },
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $project: { tag: "$_id", count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]).exec();

      return { success: true, data: tags };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch tags";
      return { success: false, error: message };
    }
  }

  /**
   * Create a new blog post
   */
  async create(data: {
    title: string;
    slug?: string;
    excerpt: string;
    content: string;
    coverImage?: string;
    category: string;
    tags?: string[];
    readTime?: number;
    isPublished?: boolean;
    publishedAt?: Date;
  }): Promise<ServiceResult<BlogPostDoc>> {
    try {
      await this.ensureConnection();
      const post = await BlogPost.create(data);
      const doc = post.toObject();
      return {
        success: true,
        data: { ...doc, _id: doc._id.toString() } as BlogPostDoc,
      };
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
  ): Promise<ServiceResult<BlogPostDoc>> {
    try {
      await this.ensureConnection();

      const post = await BlogPost.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      })
        .lean<BlogPostDoc>()
        .exec();

      if (!post) {
        return { success: false, error: "Blog post not found" };
      }

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
  async delete(id: string): Promise<ServiceResult<BlogPostDoc>> {
    try {
      await this.ensureConnection();

      const post = await BlogPost.findByIdAndDelete(id)
        .lean<BlogPostDoc>()
        .exec();

      if (!post) {
        return { success: false, error: "Blog post not found" };
      }

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
  async publish(id: string): Promise<ServiceResult<BlogPostDoc>> {
    const result = await this.update(id, {
      isPublished: true,
      publishedAt: new Date(),
    });

    if (result.success && result.data) {
      // Trigger email blast to subscribers
      this.notifySubscribers(result.data).catch((err) => {
        console.error("Failed to notify subscribers:", err);
      });
    }

    return result;
  }

  /**
   * Internal method to notify subscribers about a new post
   */
  private async notifySubscribers(post: BlogPostDoc): Promise<void> {
    const subsRes = await subscriberService.getActiveSubscribers();
    if (!subsRes.success || !subsRes.data || subsRes.data.length === 0) return;

    const emails = subsRes.data.map((s) => s.email);
    const blogUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/blog/${post.slug}`;

    await emailService.sendNewBlogPostNotification({
      blogTitle: post.title,
      blogExcerpt: post.excerpt,
      blogUrl: blogUrl,
      subscribers: emails,
      coverImage: post.coverImage,
    });
  }

  /**
   * Unpublish a blog post
   */
  async unpublish(id: string): Promise<ServiceResult<BlogPostDoc>> {
    return this.update(id, {
      isPublished: false,
    });
  }
}

// Singleton instance
export const blogService = new BlogService();
