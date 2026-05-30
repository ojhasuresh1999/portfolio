import { Api } from "@/server/utils/api-response";
import { revalidatePath } from "next/cache";
import { handleError } from "@/server/utils/error-handler";
import {
  validateBody,
  idParamSchema,
  validateParams,
  techStackSchema,
} from "@/server/utils/validation";
import { techStackService } from "@/server/services/tech-stack.service";
import { withAdmin } from "@/server/utils/auth-middleware";
import { auditLog } from "@/server/utils/audit-logger";

/**
 * @swagger
 * /api/tech-stack/{id}:
 *   put:
 *     summary: Update Tech Stack Item
 *     description: Update an existing tech stack entry (Admin only)
 *     tags:
 *       - TechStack
 */
export const PUT = withAdmin(async (request, { params, admin, ip }) => {
  try {
    const paramsResult = validateParams(
      (params as Record<string, string>) || {},
      idParamSchema,
    );
    if (!paramsResult.success) return Api.validationError(paramsResult.errors);

    const validationResult = await validateBody(
      request,
      techStackSchema.partial(),
    );
    if (!validationResult.success)
      return Api.validationError(validationResult.errors);

    const result = await techStackService.update(
      paramsResult.data.id,
      validationResult.data,
    );

    if (!result.success) {
      if (result.error === "Record not found")
        return Api.notFound("Tech Stack item not found");
      throw new Error(result.error);
    }

    auditLog.update(admin, "techStack", paramsResult.data.id, undefined, ip);

    revalidatePath("/", "layout");

    return Api.success(result.data);
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/tech-stack/{id}:
 *   delete:
 *     summary: Delete Tech Stack Item
 *     description: Delete an existing tech stack entry (Admin only)
 *     tags:
 *       - TechStack
 */
export const DELETE = withAdmin(async (request, { params, admin, ip }) => {
  try {
    const paramsResult = validateParams(
      (params as Record<string, string>) || {},
      idParamSchema,
    );
    if (!paramsResult.success) return Api.validationError(paramsResult.errors);

    const result = await techStackService.delete(paramsResult.data.id);

    if (!result.success) {
      if (result.error === "Record not found")
        return Api.notFound("Tech Stack item not found");
      throw new Error(result.error);
    }

    auditLog.delete(admin, "techStack", paramsResult.data.id, ip);

    revalidatePath("/", "layout");

    return Api.success(null, "Tech stack item deleted successfully");
  } catch (error) {
    return handleError(error);
  }
});
