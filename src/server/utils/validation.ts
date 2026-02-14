import { NextRequest } from "next/server";
import * as z from "zod";

/**
 * Validation Result Type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

/**
 * Parse and validate request body against a Zod schema
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue) => {
        const path = issue.path.join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      });
      return { success: false, errors };
    }
    if (error instanceof SyntaxError) {
      return { success: false, errors: ["Invalid JSON body"] };
    }
    return { success: false, errors: ["Failed to parse request body"] };
  }
}

/**
 * Parse and validate URL search params against a Zod schema
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
): ValidationResult<T> {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue) => {
        const path = issue.path.join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ["Failed to parse query parameters"] };
  }
}

/**
 * Validate route params (for dynamic routes)
 */
export function validateParams<T>(
  params: Record<string, string>,
  schema: z.ZodSchema<T>,
): ValidationResult<T> {
  try {
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue) => {
        const path = issue.path.join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ["Invalid route parameters"] };
  }
}

// ============================================
// Common Validation Schemas
// ============================================

/**
 * Pagination query schema
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().positive().max(100)),
});

/**
 * ID parameter schema (cuid)
 */
export const idParamSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

/**
 * Slug parameter schema
 */
export const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
});

/**
 * Search query schema
 */
export const searchQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// ============================================
// Entity-Specific Validation Schemas
// ============================================

/**
 * Contact form submission schema
 */
export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  subject: z.string().max(200).optional(),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

/**
 * Project creation/update schema
 */
export const projectSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format")
    .optional(),
  description: z.string().min(1, "Description is required").max(500),
  longDescription: z.string().max(5000).optional(),
  image: z.string().url().optional(),
  codeSnippet: z.string().max(2000).optional(),
  technologies: z.array(z.string()).default([]),
  liveUrl: z
    .string()
    .url()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  githubUrl: z
    .string()
    .url()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  accentColor: z.enum(["primary", "secondary"]).default("primary"),
  order: z.number().int().default(0),
  isFeatured: z.boolean().default(false),
  isVisible: z.boolean().default(true),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

/**
 * Blog post schema
 */
export const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format")
    .optional(),
  excerpt: z.string().min(1, "Excerpt is required").max(500),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().url().optional(),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).default([]),
  readTime: z.number().int().positive().default(5),
  isPublished: z.boolean().default(false),
  publishedAt: z.coerce.date().optional(),
});

export type BlogPostFormData = z.infer<typeof blogPostSchema>;
