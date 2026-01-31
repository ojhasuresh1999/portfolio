import { Api } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/error-handler";
import { validateParams, slugParamSchema } from "@/server/utils/validation";
import { projectService } from "@/server/services/project.service";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/projects/[slug]
 * Get a single project by slug
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;

    // Validate slug parameter
    const paramsResult = validateParams(resolvedParams, slugParamSchema);
    if (!paramsResult.success) {
      return Api.validationError(paramsResult.errors);
    }

    const result = await projectService.getBySlug(paramsResult.data.slug);

    if (!result.success) {
      return Api.internalError(result.error);
    }

    if (!result.data) {
      return Api.notFound("Project not found");
    }

    return Api.success(result.data);
  } catch (error) {
    return handleError(error);
  }
}
