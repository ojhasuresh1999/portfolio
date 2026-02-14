"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

// ============================================
// Types
// ============================================

export interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

interface CloudinaryUploadProps {
  /** Current image URL (for edit mode) */
  value?: string;
  /** Current publicId (for deletion) */
  publicId?: string;
  /** Called after successful upload */
  onUpload: (result: UploadResult) => void;
  /** Called after image removal */
  onRemove?: () => void;
  /** Subfolder within portfolio/ on Cloudinary */
  folder?: string;
  /** Custom label */
  label?: string;
  /** Additional class names */
  className?: string;
  /** Whether upload is disabled */
  disabled?: boolean;
}

// ── Constants ──────────────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

// ============================================
// CloudinaryUpload Component
// ============================================

export default function CloudinaryUpload({
  value,
  publicId,
  onUpload,
  onRemove,
  folder,
  label = "Upload Image",
  className = "",
  disabled = false,
}: CloudinaryUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Client-side validation ───────────────
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type. Allowed: JPEG, PNG, WebP, GIF, SVG`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is 10MB`;
    }
    return null;
  };

  // ── Upload handler ───────────────────────
  const handleUpload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setIsUploading(true);
      setProgress(0);

      // Show local preview immediately
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);

      try {
        const formData = new FormData();
        formData.append("file", file);
        if (folder) formData.append("folder", folder);

        // Use XMLHttpRequest for progress tracking
        const result = await new Promise<UploadResult>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setProgress(pct);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const response = JSON.parse(xhr.responseText);
              if (response.success) {
                resolve(response.data);
              } else {
                reject(new Error(response.error || "Upload failed"));
              }
            } else {
              try {
                const errResponse = JSON.parse(xhr.responseText);
                reject(
                  new Error(
                    errResponse.error || `Upload failed (${xhr.status})`,
                  ),
                );
              } catch {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            }
          });

          xhr.addEventListener("error", () =>
            reject(new Error("Network error during upload")),
          );
          xhr.addEventListener("abort", () =>
            reject(new Error("Upload cancelled")),
          );

          xhr.open("POST", "/api/upload");
          xhr.send(formData);
        });

        setProgress(100);
        onUpload(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        setPreview(null);
      } finally {
        setIsUploading(false);
        URL.revokeObjectURL(localPreview);
      }
    },
    [folder, onUpload],
  );

  // ── Delete handler ───────────────────────
  const handleRemove = useCallback(async () => {
    if (publicId) {
      try {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId }),
        });
      } catch {
        // Silently fail — we still clear the UI
      }
    }
    setPreview(null);
    setError(null);
    setProgress(0);
    onRemove?.();
  }, [publicId, onRemove]);

  // ── Drag & Drop handlers ────────────────
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !isUploading) setIsDragging(true);
    },
    [disabled, isUploading],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [disabled, isUploading, handleUpload],
  );

  // ── File input change ───────────────────
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [handleUpload],
  );

  // ── Render: Existing image ──────────────
  const displayUrl = value || preview;

  if (displayUrl && !isUploading) {
    return (
      <div className={`relative group ${className}`}>
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-white/10 bg-obsidian">
          <Image
            src={displayUrl}
            alt="Uploaded image"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />

          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="p-2.5 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors border border-white/20"
              title="Replace image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="p-2.5 bg-red-500/20 backdrop-blur-sm rounded-lg text-red-400 hover:bg-red-500/30 transition-colors border border-red-500/30"
              title="Remove image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hidden file input for replacement */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  // ── Render: Upload zone ─────────────────
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-400 mb-2">
          {label}
        </label>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() =>
          !disabled && !isUploading && fileInputRef.current?.click()
        }
        className={`
          relative w-full min-h-[12rem] rounded-xl border-2 border-dashed cursor-pointer
          flex flex-col items-center justify-center gap-3 p-6
          transition-all duration-200 ease-out
          ${
            isDragging
              ? "border-primary bg-primary/5 shadow-[0_0_30px_rgba(0,255,136,0.1)]"
              : "border-white/15 bg-obsidian hover:border-white/30 hover:bg-white/[0.02]"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${isUploading ? "pointer-events-none" : ""}
        `}
      >
        {isUploading ? (
          // ── Upload progress ────────────────
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            {/* Animated upload icon */}
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-2 border-primary/20 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-primary animate-bounce"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              {/* Spinning ring */}
              <svg
                className="absolute inset-0 w-14 h-14 animate-spin"
                viewBox="0 0 56 56"
              >
                <circle
                  cx="28"
                  cy="28"
                  r="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="163.36"
                  strokeDashoffset={163.36 * (1 - progress / 100)}
                  className="text-primary transition-all duration-300"
                  strokeLinecap="round"
                  transform="rotate(-90 28 28)"
                />
              </svg>
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-white">Uploading...</p>
              <p className="text-xs text-slate-500 mt-0.5">{progress}%</p>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          // ── Drop zone content ──────────────
          <>
            <div
              className={`
                w-14 h-14 rounded-xl flex items-center justify-center transition-colors
                ${isDragging ? "bg-primary/10" : "bg-white/5"}
              `}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-7 h-7 transition-colors ${isDragging ? "text-primary" : "text-slate-500"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>

            <div className="text-center">
              <p className="text-sm text-white">
                <span className="text-primary font-semibold">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PNG, JPG, WebP, GIF, SVG up to 10MB
              </p>
            </div>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-red-400 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-xs text-red-400 flex-1">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400/60 hover:text-red-400 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
