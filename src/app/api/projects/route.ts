import { NextRequest } from "next/server";
import { Api } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/error-handler";
import {
  validateQuery,
  paginationSchema,
  projectSchema,
} from "@/server/utils/validation";
import { projectService } from "@/server/services/project.service";
import { uploadService } from "@/server/services/upload.service";
import { withAdmin } from "@/server/utils/auth-middleware";
import { auditLog } from "@/server/utils/audit-logger";

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
    const includeHidden =
      request.nextUrl.searchParams.get("includeHidden") === "true";

    const result = await projectService.getAll({
      page,
      limit,
      featured:
        featured === "true" ? true : featured === "false" ? false : undefined,
      includeHidden,
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
 *     description: Create a new project with optional image upload (Admin only)
 *     tags:
 *       - Projects
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Project image file
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               longDescription:
 *                 type: string
 *               technologies:
 *                 type: array
 *                 items:
 *                   type: string
 *               liveUrl:
 *                 type: string
 *               githubUrl:
 *                 type: string
 *               accentColor:
 *                 type: string
 *                 enum: [primary, secondary]
 *               order:
 *                 type: integer
 *               isFeatured:
 *                 type: boolean
 *               isVisible:
 *                 type: boolean
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
 *       400:
 *         description: Bad Request (Validation or Upload Error)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       422:
 *         description: Validation Error
 */
export const POST = withAdmin(async (request, { admin, ip }) => {
  let uploadedPublicId: string | null = null;

  try {
    const formData = await request.formData();

    const rawData: Record<string, unknown> = {};

    const textFields = [
      "title",
      "description",
      "longDescription",
      "codeSnippet",
      "liveUrl",
      "githubUrl",
      "accentColor",
      "status",
      "image",
    ];
    for (const field of textFields) {
      const val = formData.get(field);
      if (val && typeof val === "string" && val.trim() !== "") {
        rawData[field] = val.trim();
      }
    }
    const order = formData.get("order");
    if (order && typeof order === "string") {
      const parsed = parseInt(order, 10);
      if (!isNaN(parsed)) rawData.order = parsed;
    }

    const boolFields = ["isFeatured", "isVisible", "isSourceCodeVisible"];
    for (const field of boolFields) {
      const val = formData.get(field);
      if (val === "true") rawData[field] = true;
      if (val === "false") rawData[field] = false;
    }

    const techEntries = formData.getAll("technologies");
    if (techEntries.length > 0) {
      const techs = techEntries
        .map((t) => t.toString().trim())
        .filter((t) => t !== "");

      if (
        techs.length === 1 &&
        techs[0].startsWith("[") &&
        techs[0].endsWith("]")
      ) {
        try {
          const parsed = JSON.parse(techs[0]);
          if (Array.isArray(parsed)) rawData.technologies = parsed;
        } catch (_) {
          rawData.technologies = techs;
        }
      } else {
        rawData.technologies = techs;
      }
    }

    const imageEntries = formData.getAll("images");
    if (imageEntries.length > 0) {
      const imgs = imageEntries
        .map((img) => img.toString().trim())
        .filter((img) => img !== "");

      if (
        imgs.length === 1 &&
        imgs[0].startsWith("[") &&
        imgs[0].endsWith("]")
      ) {
        try {
          const parsed = JSON.parse(imgs[0]);
          if (Array.isArray(parsed)) rawData.images = parsed;
        } catch (_) {
          rawData.images = imgs;
        }
      } else {
        rawData.images = imgs;
      }
    }

    const file = formData.get("file") as File | null;

    const validationResult = projectSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => {
        const path = issue.path.join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      });
      return Api.validationError(errors);
    }

    let validatedData = validationResult.data;

    if (file && file.size > 0) {
      const fileValidation = uploadService.validateFile(file);
      if (!fileValidation.valid) {
        return Api.badRequest(fileValidation.error || "Invalid file");
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const sanitizedTitle = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-");

      const uploadResult = await uploadService.uploadImage(buffer, {
        folder: `projects/${sanitizedTitle}`,
        tags: ["project", "portfolio"],
      });

      if (!uploadResult.success) {
        return Api.internalError(`Image upload failed: ${uploadResult.error}`);
      }

      uploadedPublicId = uploadResult.data.publicId;
      console.log("🚀 ~ uploadedPublicId:", uploadedPublicId);

      validatedData = {
        ...validatedData,
        image: uploadResult.data.secureUrl,
      };
    }

    const result = await projectService.create(validatedData);

    if (!result.success) {
      throw new Error(result.error);
    }

    auditLog.create(
      admin,
      "project",
      result.data._id.toString(),
      {
        title: result.data.title,
        hasImage: !!uploadedPublicId,
      },
      ip,
    );

    return Api.created(result.data);
  } catch (error) {
    if (uploadedPublicId) {
      console.warn(`[Rollback] Deleting orphaned image: ${uploadedPublicId}`);
      try {
        await uploadService.deleteImage(uploadedPublicId);
      } catch (cleanupError) {
        console.error(
          `[Rollback Failed] Could not delete image ${uploadedPublicId}:`,
          cleanupError,
        );
      }
    }

    return handleError(error);
  }
});
