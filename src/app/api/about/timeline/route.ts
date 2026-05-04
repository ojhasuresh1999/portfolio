import { NextRequest } from "next/server";
import { Api } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/error-handler";
import { validateBody, timelineEntrySchema } from "@/server/utils/validation";
import { aboutService } from "@/server/services/about.service";
import { withAdmin } from "@/server/utils/auth-middleware";
import { auditLog } from "@/server/utils/audit-logger";

/**
 * @swagger
 * /api/about/timeline:
 *   get:
 *     summary: Get Timeline Entries
 *     description: Retrieve all timeline journey entries
 *     tags:
 *       - About
 */
export async function GET(request: NextRequest) {
  try {
    const includeHidden =
      request.nextUrl.searchParams.get("includeHidden") === "true";

    const result = includeHidden
      ? await aboutService.getAllTimeline()
      : await aboutService.getVisibleTimeline();

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
 * /api/about/timeline:
 *   post:
 *     summary: Create Timeline Entry
 *     description: Create a new timeline/journey entry (Admin only)
 *     tags:
 *       - About
 *     security:
 *       - BearerAuth: []
 */
export const POST = withAdmin(async (request, { admin, ip }) => {
  try {
    const validationResult = await validateBody(request, timelineEntrySchema);

    if (!validationResult.success) {
      return Api.validationError(validationResult.errors);
    }

    const result = await aboutService.createTimelineEntry(
      validationResult.data,
    );

    if (!result.success) {
      throw new Error(result.error);
    }

    auditLog.create(
      admin,
      "timeline_entry",
      result.data._id.toString(),
      { title: result.data.title },
      ip,
    );

    return Api.created(result.data);
  } catch (error) {
    return handleError(error);
  }
});
