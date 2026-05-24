import { Api } from "@/server/utils/api-response";
import { withAdmin } from "@/server/utils/auth-middleware";
import { contactService } from "@/server/services/contact.service";

/**
 * POST /api/admin/contacts/[id]/reply
 * Sends an email reply back to the user and appends it to the conversation thread.
 */
export const POST = withAdmin(async (request, { params, admin }) => {
  try {
    const id = params?.id;
    if (!id) {
      return Api.badRequest("Missing ticket identifier");
    }

    const body = await request.json();
    const { message } = body;

    if (!message || message.trim() === "") {
      return Api.badRequest("Reply message content cannot be empty");
    }

    const result = await contactService.replyToSubmission({
      id,
      message: message.trim(),
      adminId: admin.userId,
      adminName: admin.email,
    });

    if (!result.success) {
      return Api.internalError(result.error);
    }

    return Api.success(result.data, "Reply sent and recorded successfully");
  } catch (error) {
    return Api.internalError(
      error instanceof Error ? error.message : "API Error",
    );
  }
});
