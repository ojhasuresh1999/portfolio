import { NextRequest } from "next/server";
import { Api } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/error-handler";
import { emailTemplateService } from "@/server/services/email-template.service";
import { withAdmin } from "@/server/utils/auth-middleware";
import { auditLog } from "@/server/utils/audit-logger";

/**
 * GET /api/email-templates/[type]
 * Fetch a template by type slug — Admin only
 */
export const GET = withAdmin(async (_request: NextRequest, { params }) => {
  try {
    const templateType =
      (params as Record<string, string>)?.type ?? "contact_auto_reply";
    const result = await emailTemplateService.getByType(templateType);

    if (!result.success) {
      return Api.notFound(result.error);
    }

    return Api.success(result.data);
  } catch (error) {
    return handleError(error);
  }
});

/**
 * PUT /api/email-templates/[type]
 * Update a template by type slug — Admin only
 */
export const PUT = withAdmin(
  async (request: NextRequest, { params, admin, ip }) => {
    try {
      const templateType =
        (params as Record<string, string>)?.type ?? "contact_auto_reply";
      const body = await request.json();

      if (!body || typeof body !== "object") {
        return Api.badRequest("Request body is required");
      }

      const result = await emailTemplateService.upsert(templateType, body);

      if (!result.success) {
        return Api.internalError(result.error);
      }

      auditLog.update(
        admin,
        "email_template",
        templateType,
        { updatedFields: Object.keys(body) },
        ip,
      );

      return Api.success(result.data, "Email template updated successfully");
    } catch (error) {
      return handleError(error);
    }
  },
);
