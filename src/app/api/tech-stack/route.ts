import { NextRequest } from "next/server";
import { Api } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/error-handler";
import { validateBody, techStackSchema } from "@/server/utils/validation";
import { techStackService } from "@/server/services/tech-stack.service";
import { withAdmin } from "@/server/utils/auth-middleware";
import { auditLog } from "@/server/utils/audit-logger";

/**
 * @swagger
 * /api/tech-stack:
 *   get:
 *     summary: List Tech Stack
 *     description: Retrieve all tech stack items without pagination
 *     tags:
 *       - TechStack
 */
export async function GET(request: NextRequest) {
  try {
    const result = await techStackService.getAllTechStack();

    if (!result.success) {
      return Api.internalError(result.error);
    }

    const includeHidden =
      request.nextUrl.searchParams.get("includeHidden") === "true";
    const data = includeHidden
      ? result.data!
      : result.data!.filter((ts) => ts.isVisible);

    return Api.success(data);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * @swagger
 * /api/tech-stack:
 *   post:
 *     summary: Create Tech Stack Item
 *     description: Create a new tech stack entry (Admin only)
 *     tags:
 *       - TechStack
 */
export const POST = withAdmin(async (request, { admin, ip }) => {
  try {
    const validationResult = await validateBody(request, techStackSchema);

    if (!validationResult.success) {
      return Api.validationError(validationResult.errors);
    }

    const validatedData = validationResult.data;
    const result = await techStackService.create(validatedData);

    if (!result.success) {
      throw new Error(result.error);
    }

    auditLog.create(
      admin,
      "techStack",
      result.data._id.toString(),
      { name: result.data.name },
      ip,
    );

    return Api.created(result.data);
  } catch (error) {
    return handleError(error);
  }
});
