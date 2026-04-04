import { Api } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/error-handler";
import {
  validateBody,
  idParamSchema,
  validateParams,
  skillSchema,
} from "@/server/utils/validation";
import { skillService } from "@/server/services/skill.service";
import { withAdmin } from "@/server/utils/auth-middleware";
import { auditLog } from "@/server/utils/audit-logger";

/**
 * @swagger
 * /api/skills/{id}:
 *   put:
 *     summary: Update Skill
 *     description: Update an existing skill (Admin only)
 *     tags:
 *       - Skills
 */
export const PUT = withAdmin(async (request, { params, admin, ip }) => {
  try {
    const paramsResult = validateParams(
      (params as Record<string, string>) || {},
      idParamSchema,
    );
    if (!paramsResult.success) return Api.validationError(paramsResult.errors);

    const validationResult = await validateBody(request, skillSchema.partial());
    if (!validationResult.success)
      return Api.validationError(validationResult.errors);

    const result = await skillService.update(
      paramsResult.data.id,
      validationResult.data,
    );

    if (!result.success) {
      if (result.error === "Record not found")
        return Api.notFound("Skill not found");
      throw new Error(result.error);
    }

    auditLog.update(admin, "skill", paramsResult.data.id, undefined, ip);

    return Api.success(result.data);
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/skills/{id}:
 *   delete:
 *     summary: Delete Skill
 *     description: Delete an existing skill (Admin only)
 *     tags:
 *       - Skills
 */
export const DELETE = withAdmin(async (request, { params, admin, ip }) => {
  try {
    const paramsResult = validateParams(
      (params as Record<string, string>) || {},
      idParamSchema,
    );
    if (!paramsResult.success) return Api.validationError(paramsResult.errors);

    const result = await skillService.delete(paramsResult.data.id);

    if (!result.success) {
      if (result.error === "Record not found")
        return Api.notFound("Skill not found");
      throw new Error(result.error);
    }

    auditLog.delete(admin, "skill", paramsResult.data.id, ip);

    return Api.success(null, "Skill deleted successfully");
  } catch (error) {
    return handleError(error);
  }
});
