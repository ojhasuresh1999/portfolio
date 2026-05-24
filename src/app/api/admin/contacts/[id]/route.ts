import { Api } from "@/server/utils/api-response";
import { withAdmin } from "@/server/utils/auth-middleware";
import { contactService } from "@/server/services/contact.service";

/**
 * GET /api/admin/contacts/[id]
 * Fetch a single ticket's full thread, activities, notes, and previous emails list.
 */
export const GET = withAdmin(async (_request, { params, admin }) => {
  try {
    const id = params?.id;
    if (!id) {
      return Api.badRequest("Missing ticket identifier");
    }

    const result = await contactService.getById(id, {
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

/**
 * PATCH /api/admin/contacts/[id]
 * Update specific properties (status, priority, assignedTo, or tags) of the ticket.
 */
export const PATCH = withAdmin(async (request, { params, admin }) => {
  try {
    const id = params?.id;
    if (!id) {
      return Api.badRequest("Missing ticket identifier");
    }

    const body = await request.json();
    const { status, priority, assignedTo, tags } = body;

    const result = await contactService.updateProperties({
      id,
      status,
      priority,
      assignedTo,
      tags,
      actorName: admin.email,
    });

    if (!result.success) {
      return Api.internalError(result.error);
    }

    return Api.success(result.data, "Ticket updated successfully");
  } catch (error) {
    return Api.internalError(
      error instanceof Error ? error.message : "API Error",
    );
  }
});

/**
 * DELETE /api/admin/contacts/[id]
 * Permanently delete a contact form submission ticket.
 */
export const DELETE = withAdmin(async (_request, { params }) => {
  try {
    const id = params?.id;
    if (!id) {
      return Api.badRequest("Missing ticket identifier");
    }

    const result = await contactService.delete(id);

    if (!result.success) {
      return Api.internalError(result.error);
    }

    return Api.success(null, "Ticket permanently deleted");
  } catch (error) {
    return Api.internalError(
      error instanceof Error ? error.message : "API Error",
    );
  }
});
