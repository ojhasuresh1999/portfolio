import { Api } from "@/server/utils/api-response";
import { withAdmin } from "@/server/utils/auth-middleware";
import { contactService } from "@/server/services/contact.service";

/**
 * GET /api/admin/contacts/config
 * Returns global CRM setups, tags, and pre-written quick replies templates.
 */
export const GET = withAdmin(async () => {
  try {
    const result = await contactService.getConfig();

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

/**
 * PUT /api/admin/contacts/config
 * Updates global SLA times, tags list, quick reply templates, and auto-reply scripts.
 */
export const PUT = withAdmin(async (request) => {
  try {
    const body = await request.json();
    const result = await contactService.updateConfig(body);

    if (!result.success) {
      return Api.internalError(result.error);
    }

    return Api.success(result.data, "Configuration updated successfully");
  } catch (error) {
    return Api.internalError(
      error instanceof Error ? error.message : "API Error",
    );
  }
});
