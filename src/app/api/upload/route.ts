import { NextRequest } from "next/server";
import { Api } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/error-handler";
import { uploadService } from "@/server/services/upload.service";
import { withAdmin } from "@/server/utils/auth-middleware";
import { auditLog } from "@/server/utils/audit-logger";

/**
 * POST /api/upload
 * Upload a file to Cloudinary (Admin only)
 *
 * Accepts multipart/form-data with:
 * - file: File (required) — the image to upload
 * - folder: string (optional) — subfolder within portfolio/
 * - tags: string (optional) — comma-separated tags
 */
export const POST = withAdmin(async (request: NextRequest, { admin, ip }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as string | null;
    const tagsStr = formData.get("tags") as string | null;

    // Validate file presence
    if (!file || !(file instanceof File)) {
      return Api.badRequest(
        "No file provided. Send a file in the 'file' field.",
      );
    }

    // Validate file
    const validation = uploadService.validateFile(file);
    if (!validation.valid) {
      return Api.badRequest(validation.error);
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse tags
    const tags = tagsStr
      ? tagsStr
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

    // Upload to Cloudinary
    const result = await uploadService.uploadImage(buffer, {
      folder: folder || undefined,
      tags,
    });

    if (!result.success) {
      return Api.internalError(result.error);
    }

    // Audit log
    auditLog.upload(
      admin,
      result.data.publicId || "unknown",
      {
        folder: folder || "default",
        fileName: file.name,
        fileSize: file.size,
      },
      ip,
    );

    return Api.created(result.data, "File uploaded successfully");
  } catch (error) {
    return handleError(error);
  }
});

/**
 * DELETE /api/upload
 * Delete a file from Cloudinary (Admin only)
 *
 * Accepts JSON body:
 * - publicId: string (required) — Cloudinary public ID of the image
 */
export const DELETE = withAdmin(async (request: NextRequest, { admin, ip }) => {
  try {
    const body = await request.json();
    const { publicId } = body;

    if (!publicId || typeof publicId !== "string") {
      return Api.badRequest("publicId is required");
    }

    const result = await uploadService.deleteImage(publicId);

    if (!result.success) {
      return Api.internalError(result.error);
    }

    // Audit log
    auditLog.delete(admin, "file", publicId, ip);

    return Api.success(result.data, "File deleted successfully");
  } catch (error) {
    return handleError(error);
  }
});
