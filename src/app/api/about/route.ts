import { NextRequest } from "next/server";
import { Api } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/error-handler";
import { validateBody, aboutContentSchema } from "@/server/utils/validation";
import { aboutService } from "@/server/services/about.service";
import { withAdmin } from "@/server/utils/auth-middleware";
import { auditLog } from "@/server/utils/audit-logger";

/**
 * @swagger
 * /api/about:
 *   get:
 *     summary: Get About Content
 *     description: Retrieve the active about section content
 *     tags:
 *       - About
 *     responses:
 *       200:
 *         description: About content
 */
export async function GET(_request: NextRequest) {
  try {
    const result = await aboutService.getAboutContent();

    if (!result.success) {
      return Api.internalError(result.error);
    }

    return Api.success(result.data);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * @swagger
 * /api/about:
 *   put:
 *     summary: Update About Content
 *     description: Create or update the about section content (Admin only)
 *     tags:
 *       - About
 *     security:
 *       - BearerAuth: []
 */
export const PUT = withAdmin(async (request, { admin, ip }) => {
  try {
    const validationResult = await validateBody(request, aboutContentSchema);

    if (!validationResult.success) {
      return Api.validationError(validationResult.errors);
    }

    const result = await aboutService.upsertAboutContent(validationResult.data);

    if (!result.success) {
      throw new Error(result.error);
    }

    auditLog.update(
      admin,
      "about_content",
      result.data._id.toString(),
      { title: result.data.title },
      ip,
    );

    return Api.success(result.data);
  } catch (error) {
    return handleError(error);
  }
});
