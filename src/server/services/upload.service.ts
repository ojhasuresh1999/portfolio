import cloudinary, {
  UPLOAD_CONFIG,
  isCloudinaryConfigured,
} from "@/lib/cloudinary";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import type { ServiceResult } from "../types";

// ============================================
// Upload Result Type
// ============================================

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  resourceType: string;
}

// ============================================
// Upload Service
// ============================================

export class UploadService {
  /**
   * Upload an image buffer to Cloudinary
   */
  async uploadImage(
    fileBuffer: Buffer,
    options?: {
      folder?: string;
      publicId?: string;
      transformation?: Record<string, unknown>;
      tags?: string[];
    },
  ): Promise<ServiceResult<CloudinaryUploadResult>> {
    try {
      if (!isCloudinaryConfigured()) {
        return {
          success: false,
          error:
            "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.",
        };
      }

      const folder = options?.folder
        ? `${UPLOAD_CONFIG.DEFAULT_FOLDER}/${options.folder}`
        : UPLOAD_CONFIG.DEFAULT_FOLDER;

      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "image",
            ...(options?.publicId && { public_id: options.publicId }),
            ...(options?.tags && { tags: options.tags }),
            transformation: [
              {
                ...UPLOAD_CONFIG.DEFAULT_TRANSFORMATIONS,
                ...options?.transformation,
              },
            ],
            // Production optimizations
            overwrite: true,
            invalidate: true,
            unique_filename: true,
          },
          (
            error: UploadApiErrorResponse | undefined,
            result: UploadApiResponse | undefined,
          ) => {
            if (error || !result) {
              reject(error || new Error("Upload failed with no result"));
            } else {
              resolve(result);
            }
          },
        );

        uploadStream.end(fileBuffer);
      });

      return {
        success: true,
        data: {
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          resourceType: result.resource_type,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload image";
      console.error("[UploadService] Upload failed:", message);
      return { success: false, error: message };
    }
  }

  /**
   * Delete an image from Cloudinary by public ID
   */
  async deleteImage(
    publicId: string,
  ): Promise<ServiceResult<{ deleted: boolean }>> {
    try {
      if (!isCloudinaryConfigured()) {
        return {
          success: false,
          error: "Cloudinary is not configured.",
        };
      }

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true,
      });

      if (result.result !== "ok" && result.result !== "not found") {
        return {
          success: false,
          error: `Failed to delete image: ${result.result}`,
        };
      }

      return { success: true, data: { deleted: true } };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete image";
      console.error("[UploadService] Delete failed:", message);
      return { success: false, error: message };
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: "No file provided" };
    }

    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
      const maxMB = UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024);
      return {
        valid: false,
        error: `File size exceeds ${maxMB}MB limit`,
      };
    }

    if (
      !UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(
        file.type as (typeof UPLOAD_CONFIG.ALLOWED_MIME_TYPES)[number],
      )
    ) {
      return {
        valid: false,
        error: `Invalid file type: ${file.type}. Allowed: ${UPLOAD_CONFIG.ALLOWED_MIME_TYPES.join(", ")}`,
      };
    }

    return { valid: true };
  }
}

// Singleton instance
export const uploadService = new UploadService();
