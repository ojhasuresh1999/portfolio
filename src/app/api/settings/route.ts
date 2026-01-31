import { Api } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/error-handler";
import { settingsService } from "@/server/services/settings.service";

/**
 * GET /api/settings
 * Get public site settings
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
