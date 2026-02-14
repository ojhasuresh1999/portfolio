import { Api } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/error-handler";
import {
  validateParams,
  validateBody,
  slugParamSchema,
  blogPostSchema,
} from "@/server/utils/validation";
import { blogService } from "@/server/services/blog.service";
import { withAdmin } from "@/server/utils/auth-middleware";
import { auditLog } from "@/server/utils/audit-logger";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/blog/[slug]
 * Get a single blog post by slug (Public)
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;

    // Validate slug parameter
    const paramsResult = validateParams(resolvedParams, slugParamSchema);
    if (!paramsResult.success) {
      return Api.validationError(paramsResult.errors);
    }

    const result = await blogService.getBySlug(paramsResult.data.slug);

    if (!result.success) {
      return Api.internalError(result.error);
    }

    if (!result.data) {
      return Api.notFound("Blog post not found");
    }

    return Api.success(result.data);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/blog/[slug]
 * Update a blog post by slug (Admin only)
 */
export const PUT = withAdmin(async (request, { admin, ip, params }) => {
  try {
    const slug = params?.slug;
    if (!slug) {
      return Api.badRequest("Slug parameter is required");
    }

    // Validate slug
    const paramsResult = validateParams({ slug }, slugParamSchema);
    if (!paramsResult.success) {
      return Api.validationError(paramsResult.errors);
    }

    // Find blog post by slug first to get its ID
    const existing = await blogService.getBySlug(slug, false);
    if (!existing.success || !existing.data) {
      return Api.notFound("Blog post not found");
    }

    // Validate request body (partial update)
    const bodyResult = await validateBody(request, blogPostSchema.partial());
    if (!bodyResult.success) {
      return Api.validationError(bodyResult.errors);
    }

    const result = await blogService.update(
      existing.data._id.toString(),
      bodyResult.data,
    );

    if (!result.success) {
      return Api.internalError(result.error);
    }

    // Audit log
    auditLog.update(
      admin,
      "blog_post",
      existing.data._id.toString(),
      {
        slug,
        updatedFields: Object.keys(bodyResult.data),
      },
      ip,
    );

    return Api.success(result.data);
  } catch (error) {
    return handleError(error);
  }
});

/**
 * DELETE /api/blog/[slug]
 * Delete a blog post by slug (Admin only)
 */
export const DELETE = withAdmin(async (_request, { admin, ip, params }) => {
  try {
    const slug = params?.slug;
    if (!slug) {
      return Api.badRequest("Slug parameter is required");
    }

    // Find blog post by slug first to get its ID
    const existing = await blogService.getBySlug(slug, false);
    if (!existing.success || !existing.data) {
      return Api.notFound("Blog post not found");
    }

    const result = await blogService.delete(existing.data._id.toString());

    if (!result.success) {
      return Api.internalError(result.error);
    }

    // Audit log
    auditLog.delete(admin, "blog_post", existing.data._id.toString(), ip);

    return Api.success(null, "Blog post deleted successfully");
  } catch (error) {
    return handleError(error);
  }
});
