import { Api } from "@/server/utils/api-response";
import { withAdmin } from "@/server/utils/auth-middleware";
import { contactService } from "@/server/services/contact.service";

/**
 * GET /api/admin/contacts/polling
 * Returns the unread badge count and a listing of the 5 most recent unread submissions.
 */
export const GET = withAdmin(async () => {
  try {
    const result = await contactService.getUnreadPollingStats();

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
