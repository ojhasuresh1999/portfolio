import { NextRequest } from "next/server";
import { Api } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/error-handler";
import { validateBody, skillSchema } from "@/server/utils/validation";
import { skillService } from "@/server/services/skill.service";
import { withAdmin } from "@/server/utils/auth-middleware";
import { auditLog } from "@/server/utils/audit-logger";

/**
 * @swagger
 * /api/skills:
 *   get:
 *     summary: List Skills
 *     description: Retrieve all skills without pagination
 *     tags:
 *       - Skills
 *     responses:
 *       200:
 *         description: List of skills
 */
export async function GET(request: NextRequest) {
  try {
    const result = await skillService.getAllSkills();

    if (!result.success) {
      return Api.internalError(result.error);
    }

    // Filter by visibility for non-admin logic, but given it's public we can do it here
    const includeHidden =
      request.nextUrl.searchParams.get("includeHidden") === "true";
    const data = includeHidden
      ? result.data!
      : result.data!.filter((s) => s.isVisible);

    return Api.success(data);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * @swagger
 * /api/skills:
 *   post:
 *     summary: Create Skill
 *     description: Create a new skill (Admin only)
 *     tags:
 *       - Skills
 *     security:
 *       - BearerAuth: []
 */
export const POST = withAdmin(async (request, { admin, ip }) => {
  try {
    const validationResult = await validateBody(request, skillSchema);

    if (!validationResult.success) {
      return Api.validationError(validationResult.errors);
    }

    const validatedData = validationResult.data;
    const result = await skillService.create(validatedData);

    if (!result.success) {
      throw new Error(result.error);
    }

    auditLog.create(
      admin,
      "skill",
      result.data._id.toString(),
      { name: result.data.name },
      ip,
    );

    return Api.created(result.data);
  } catch (error) {
    return handleError(error);
  }
});
