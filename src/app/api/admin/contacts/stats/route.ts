import { Api } from "@/server/utils/api-response";
import { withAdmin } from "@/server/utils/auth-middleware";
import { contactService } from "@/server/services/contact.service";

/**
 * GET /api/admin/contacts/stats
 * Returns helpdesk metrics, status/priority distributions, and timeline analytics.
 */
export const GET = withAdmin(async (_request, { admin }) => {
  try {
    const result = await contactService.getStats({
      agentId: admin.userId,
      role: admin.role,
    });

    if (!result.success) {
      return Api.internalError(result.error);
    }

    return Api.success(result.data);
  } catch (error) {
    return Api.internalError(
      error instanceof Error ? error.message : "API Error",
    );
  }
});
