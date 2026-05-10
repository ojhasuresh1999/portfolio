import { Api } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/error-handler";
import { Subscriber } from "@/models";
import { connectToDatabase } from "@/lib/mongodb";
import { withAdmin } from "@/server/utils/auth-middleware";

/**
 * @swagger
 * /api/admin/subscribers:
 *   get:
 *     summary: Get All Subscribers
 *     description: Retrieve all newsletter subscribers (Admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 */
export const GET = withAdmin(async (_request) => {
  try {
    await connectToDatabase();

    const subscribers = await Subscriber.find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return Api.success(subscribers);
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/admin/subscribers/{id}:
 *   delete:
 *     summary: Unsubscribe a user
 *     description: Unsubscribe a user manually (Admin only)
 *     tags:
 *       - Admin
 */
export const DELETE = withAdmin(async (request) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return Api.badRequest("Subscriber ID is required");
    }

    await connectToDatabase();

    const subscriber = await Subscriber.findByIdAndUpdate(
      id,
      { isActive: false, unsubscribedAt: new Date() },
      { new: true },
    );

    if (!subscriber) {
      return Api.notFound("Subscriber not found");
    }

    return Api.success(subscriber);
  } catch (error) {
    return handleError(error);
  }
});
