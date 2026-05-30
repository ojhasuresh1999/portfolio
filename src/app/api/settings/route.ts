import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
import { Api } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/error-handler";
import { settingsService } from "@/server/services/settings.service";
import { withAdmin } from "@/server/utils/auth-middleware";
import { auditLog } from "@/server/utils/audit-logger";

/**
 * GET /api/settings
 * Get public site settings (Public — no auth required)
 */
export async function GET() {
  try {
    const result = await settingsService.getPublic();

    if (!result.success) {
      return Api.internalError(result.error);
    }

    return Api.success(result.data);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/settings
 * Update site settings (Admin only)
 */
export const PUT = withAdmin(async (request: NextRequest, { admin, ip }) => {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return Api.badRequest("Request body is required");
    }

    const result = await settingsService.update(body);

    if (!result.success) {
      return Api.internalError(result.error);
    }

    // Audit log
    auditLog.update(
      admin,
      "site_settings",
      "global",
      {
        updatedFields: Object.keys(body),
      },
      ip,
    );

    revalidatePath("/", "layout");

    return Api.success(result.data, "Settings updated successfully");
  } catch (error) {
    return handleError(error);
  }
});
