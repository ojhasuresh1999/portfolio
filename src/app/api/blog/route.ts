import { NextRequest } from "next/server";
import { Api } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/error-handler";
import {
  validateQuery,
  validateBody,
  paginationSchema,
  blogPostSchema,
} from "@/server/utils/validation";
import { blogService } from "@/server/services/blog.service";
import { withAdmin } from "@/server/utils/auth-middleware";
import { auditLog } from "@/server/utils/audit-logger";

/**
 * @swagger
 * /api/blog:
 *   get:
 *     summary: List Blog Posts
 *     description: Retrieve a paginated list of published blog posts
 *     tags:
 *       - Blog
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of blog posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BlogPost'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const queryResult = validateQuery(request, paginationSchema);
    if (!queryResult.success) {
      return Api.validationError(queryResult.errors);
    }

    const { page, limit } = queryResult.data;
    const category = request.nextUrl.searchParams.get("category") ?? undefined;
    const includeAll =
      request.nextUrl.searchParams.get("includeAll") === "true";

    let result;
    if (includeAll) {
      // Admin: include all posts (published + drafts)
      result = await blogService.getAll({ page, limit });
    } else {
      result = await blogService.getPublished({ page, limit, category });
    }

    if (!result.success) {
      return Api.internalError(result.error);
    }

    return Api.paginated(result.data.items, page, limit, result.data.total);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * @swagger
 * /api/blog:
 *   post:
 *     summary: Create Blog Post
 *     description: Create a new blog post (Admin only)
 *     tags:
 *       - Blog
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BlogPost'
 *     responses:
 *       201:
 *         description: Blog post created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       422:
 *         description: Validation Error
 */
export const POST = withAdmin(async (request, { admin, ip }) => {
  try {
    // Validate request body
    const bodyResult = await validateBody(request, blogPostSchema);
    if (!bodyResult.success) {
      return Api.validationError(bodyResult.errors);
    }

    const result = await blogService.create(bodyResult.data);

    if (!result.success) {
      return Api.internalError(result.error);
    }

    // Audit log
    auditLog.create(
      admin,
      "blog_post",
      result.data._id.toString(),
      {
        title: bodyResult.data.title,
      },
      ip,
    );

    return Api.created(result.data);
  } catch (error) {
    return handleError(error);
  }
});
