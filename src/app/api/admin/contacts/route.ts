import { NextResponse } from "next/server";
import { Api } from "@/server/utils/api-response";
import { withAdmin } from "@/server/utils/auth-middleware";
import { contactService } from "@/server/services/contact.service";
import { ContactSubmission } from "@/models";

/**
 * GET /api/admin/contacts
 * Query all contact submissions with pagination, sorting, search, and filters.
 */
export const GET = withAdmin(async (request, { admin }) => {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const assignedTo = searchParams.get("assignedTo") || undefined;
    const tag = searchParams.get("tag") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const sortBy = searchParams.get("sortBy") || undefined;
    const sortOrder =
      (searchParams.get("sortOrder") as "asc" | "desc") || undefined;

    const result = await contactService.getAllAdvanced({
      page,
      limit,
      search,
      status,
      priority,
      assignedTo,
      tag,
      startDate,
      endDate,
      sortBy,
      sortOrder,
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
 * POST /api/admin/contacts
 * Handles bulk operations (read status, assignments, priority, delete) and CSV exports.
 */
export const POST = withAdmin(async (request, { admin }) => {
  try {
    const body = await request.json();
    const { action, ids, value } = body;

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return Api.badRequest("Invalid bulk action input parameters");
    }

    const actorName = admin.email;

    // Handle CSV Export action
    if (action === "export_csv") {
      const tickets = await ContactSubmission.find({ _id: { $in: ids } })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      const headers = [
        "Name",
        "Email",
        "Subject",
        "Message",
        "Status",
        "Priority",
        "Assigned Agent",
        "Tags",
        "Date Submitted",
      ];

      const rows = tickets.map((t) => [
        `"${t.name.replace(/"/g, '""')}"`,
        `"${t.email.replace(/"/g, '""')}"`,
        `"${(t.subject || "").replace(/"/g, '""')}"`,
        `"${t.message.replace(/"/g, '""').replace(/\n/g, " ")}"`,
        t.status.toUpperCase(),
        t.priority.toUpperCase(),
        t.assignedToName || "Unassigned",
        `"${(t.tags || []).join(",")}"`,
        t.createdAt.toISOString(),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((r) => r.join(",")),
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=contacts_export.csv",
        },
      });
    }

    const result = await contactService.bulkAction({
      ids,
      action,
      value,
      actorName,
    });

    if (!result.success) {
      return Api.internalError(result.error);
    }

    return Api.success(result.data, "Bulk operation completed successfully");
  } catch (error) {
    return Api.internalError(
      error instanceof Error ? error.message : "API Error",
    );
  }
});
