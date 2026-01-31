import { Api } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/error-handler";
import { validateParams, slugParamSchema } from "@/server/utils/validation";
import { blogService } from "@/server/services/blog.service";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/blog/[slug]
 * Get a single blog post by slug
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
