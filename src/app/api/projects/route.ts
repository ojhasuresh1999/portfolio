import { NextRequest } from "next/server";
import { Api } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/error-handler";
import {
  validateQuery,
  validateBody,
  paginationSchema,
  projectSchema,
} from "@/server/utils/validation";
import { projectService } from "@/server/services/project.service";

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: List Projects
 *     description: Retrieve a paginated list of projects
 *     tags:
 *       - Projects
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
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter by featured status
 *     responses:
 *       200:
 *         description: List of projects
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
 *                     $ref: '#/components/schemas/Project'
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
    const featured = request.nextUrl.searchParams.get("featured");

    const result = await projectService.getAll({
      page,
      limit,
      featured:
        featured === "true" ? true : featured === "false" ? false : undefined,
    });

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
 * /api/projects:
 *   post:
 *     summary: Create Project
 *     description: Create a new project (Admin only)
 *     tags:
 *       - Projects
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       422:
 *         description: Validation Error
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check here
    // const session = await auth();
    // if (!session?.user) {
    //   return Api.unauthorized();
    // }

    // Validate request body
    const bodyResult = await validateBody(request, projectSchema);
    if (!bodyResult.success) {
      return Api.validationError(bodyResult.errors);
    }

    const result = await projectService.create(bodyResult.data);

    if (!result.success) {
      return Api.internalError(result.error);
    }

    return Api.created(result.data);
  } catch (error) {
    return handleError(error);
  }
}
