import { Api } from "@/server/utils/api-response";
import { withAdmin } from "@/server/utils/auth-middleware";
import { contactService } from "@/server/services/contact.service";

/**
 * POST /api/admin/contacts/[id]/notes
 * Appends a private, internal-only admin note to the ticket.
 */
export const POST = withAdmin(async (request, { params, admin }) => {
  try {
    const id = params?.id;
    if (!id) {
      return Api.badRequest("Missing ticket identifier");
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim() === "") {
      return Api.badRequest("Note content cannot be empty");
    }

    const result = await contactService.addNote({
      id,
      content: content.trim(),
      adminId: admin.userId,
      adminName: admin.email,
    });

    if (!result.success) {
      return Api.internalError(result.error);
    }

    return Api.success(result.data, "Internal note appended successfully");
  } catch (error) {
    return Api.internalError(
      error instanceof Error ? error.message : "API Error",
    );
  }
});
