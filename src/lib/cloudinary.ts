import { v2 as cloudinary } from "cloudinary";

// ============================================
// Cloudinary Configuration
// ============================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ── Upload Constants ───────────────────────
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ] as const,
  DEFAULT_FOLDER: "portfolio",
  DEFAULT_TRANSFORMATIONS: {
    quality: "auto" as const,
    fetch_format: "auto" as const,
  },
} as const;

export type AllowedMimeType = (typeof UPLOAD_CONFIG.ALLOWED_MIME_TYPES)[number];

/**
 * Validate that Cloudinary is properly configured
 */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );
}

export default cloudinary;
