import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
import { Api } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/error-handler";
import { socialLinksService } from "@/server/services/social-links.service";
import { withAdmin } from "@/server/utils/auth-middleware";
import { auditLog } from "@/server/utils/audit-logger";

/**
 * GET /api/social-links
 * Get all social links (Public)
 */
export async function GET() {
  try {
    const result = await socialLinksService.getAll();

    if (!result.success) {
      return Api.internalError(result.error);
    }

    return Api.success(result.data);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/social-links
 * Bulk update/replace social links (Admin only)
 */
export const PUT = withAdmin(async (request: NextRequest, { admin, ip }) => {
  try {
    const body = await request.json();

    if (!Array.isArray(body)) {
      return Api.badRequest("Request body must be an array of social links");
    }

    const result = await socialLinksService.bulkUpdate(body);

    if (!result.success) {
      return Api.internalError(result.error);
    }

    // Audit log
    auditLog.update(
      admin,
      "social_links",
      "bulk",
      {
        count: body.length,
      },
      ip,
    );

    revalidatePath("/", "layout");

    return Api.success(result.data, "Social links updated successfully");
  } catch (error) {
    return handleError(error);
  }
});
