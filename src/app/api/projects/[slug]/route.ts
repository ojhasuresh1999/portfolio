import { Api } from "@/server/utils/api-response";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
import { handleError } from "@/server/utils/error-handler";
import {
  validateParams,
  validateBody,
  slugParamSchema,
  projectUpdateSchema,
} from "@/server/utils/validation";
import { projectService } from "@/server/services/project.service";
import { withAdmin } from "@/server/utils/auth-middleware";
import { auditLog } from "@/server/utils/audit-logger";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/projects/[slug]
 * Get a single project by slug (Public)
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

/**
 * PUT /api/projects/[slug]
 * Update a project by slug (Admin only)
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

    // Find project by slug first to get its ID
    const existing = await projectService.getBySlug(slug);
    if (!existing.success || !existing.data) {
      return Api.notFound("Project not found");
    }

    // Validate request body (partial update)
    const bodyResult = await validateBody(request, projectUpdateSchema);
    if (!bodyResult.success) {
      return Api.validationError(bodyResult.errors);
    }

    const result = await projectService.update(
      existing.data._id.toString(),
      bodyResult.data,
    );

    if (!result.success) {
      return Api.internalError(result.error);
    }

    // Audit log
    auditLog.update(
      admin,
      "project",
      existing.data._id.toString(),
      {
        slug,
        updatedFields: Object.keys(bodyResult.data),
      },
      ip,
    );

    revalidatePath("/", "layout");

    return Api.success(result.data);
  } catch (error) {
    return handleError(error);
  }
});

/**
 * DELETE /api/projects/[slug]
 * Delete a project by slug (Admin only)
 */
export const DELETE = withAdmin(async (_request, { admin, ip, params }) => {
  try {
    const slug = params?.slug;
    if (!slug) {
      return Api.badRequest("Slug parameter is required");
    }

    // Find project by slug first to get its ID
    const existing = await projectService.getBySlug(slug);
    if (!existing.success || !existing.data) {
      return Api.notFound("Project not found");
    }

    const result = await projectService.delete(existing.data._id.toString());

    if (!result.success) {
      return Api.internalError(result.error);
    }

    // Audit log
    auditLog.delete(admin, "project", existing.data._id.toString(), ip);

    revalidatePath("/", "layout");

    return Api.success(null, "Project deleted successfully");
  } catch (error) {
    return handleError(error);
  }
});
