import { Api } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/error-handler";
import {
  validateBody,
  idParamSchema,
  validateParams,
  timelineEntrySchema,
} from "@/server/utils/validation";
import { aboutService } from "@/server/services/about.service";
import { withAdmin } from "@/server/utils/auth-middleware";
import { auditLog } from "@/server/utils/audit-logger";

/**
 * @swagger
 * /api/about/timeline/{id}:
 *   patch:
 *     summary: Update Timeline Entry
 *     description: Update an existing timeline entry (Admin only)
 *     tags:
 *       - About
 */
export const PATCH = withAdmin(async (request, { params, admin, ip }) => {
  try {
    const paramsResult = validateParams(
      (params as Record<string, string>) || {},
      idParamSchema,
    );
    if (!paramsResult.success) return Api.validationError(paramsResult.errors);

    const validationResult = await validateBody(
      request,
      timelineEntrySchema.partial(),
    );
    if (!validationResult.success)
      return Api.validationError(validationResult.errors);

    const result = await aboutService.updateTimelineEntry(
      paramsResult.data.id,
      validationResult.data,
    );

    if (!result.success) {
      if (result.error === "Record not found")
        return Api.notFound("Timeline entry not found");
      throw new Error(result.error);
    }

    auditLog.update(
      admin,
      "timeline_entry",
      paramsResult.data.id,
      undefined,
      ip,
    );

    return Api.success(result.data);
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/about/timeline/{id}:
 *   delete:
 *     summary: Delete Timeline Entry
 *     description: Delete an existing timeline entry (Admin only)
 *     tags:
 *       - About
 */
export const DELETE = withAdmin(async (request, { params, admin, ip }) => {
  try {
    const paramsResult = validateParams(
      (params as Record<string, string>) || {},
      idParamSchema,
    );
    if (!paramsResult.success) return Api.validationError(paramsResult.errors);

    const result = await aboutService.deleteTimelineEntry(paramsResult.data.id);

    if (!result.success) {
      if (result.error === "Record not found")
        return Api.notFound("Timeline entry not found");
      throw new Error(result.error);
    }

    auditLog.delete(admin, "timeline_entry", paramsResult.data.id, ip);

    return Api.success(null, "Timeline entry deleted successfully");
  } catch (error) {
    return handleError(error);
  }
});
