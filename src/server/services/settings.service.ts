import prisma from "@/lib/prisma";
import type { ServiceResult } from "../types";

/**
 * Site Settings Service
 * Handles site-wide configuration
 */
export class SettingsService {
  /**
   * Get current site settings
   * Returns the first settings record or creates default if none exists
   */
  async get(): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      let settings = await prisma.siteSettings.findFirst();

      // Create default settings if none exist
      if (!settings) {
        settings = await prisma.siteSettings.create({
          data: {
            siteName: "DEV_IO",
            siteTagline: "Backend Developer Portfolio",
            logoText: "DEV_IO",
            statusText: "System Online",
            footerLatency: "12ms",
          },
        });
      }

      return {
        success: true,
        data: settings as unknown as Record<string, unknown>,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch site settings";
      return { success: false, error: message };
    }
  }

  /**
   * Update site settings
   */
  async update(
    data: Record<string, unknown>,
  ): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      // Get existing settings first
      const existing = await prisma.siteSettings.findFirst();

      if (!existing) {
        // Create if doesn't exist
        const settings = await prisma.siteSettings.create({
          data: data as {
            siteName?: string;
            siteTagline?: string;
            logoText?: string;
            statusText?: string;
            footerLatency?: string;
            metaTitle?: string;
            metaDescription?: string;
          },
        });
        return {
          success: true,
          data: settings as unknown as Record<string, unknown>,
        };
      }

      // Update existing
      const settings = await prisma.siteSettings.update({
        where: { id: existing.id },
        data,
      });

      return {
        success: true,
        data: settings as unknown as Record<string, unknown>,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update site settings";
      return { success: false, error: message };
    }
  }

  /**
   * Get public settings (excluding sensitive data)
   */
  async getPublic(): Promise<ServiceResult<Record<string, unknown>>> {
    const result = await this.get();

    if (!result.success) {
      return result;
    }

    // Remove internal fields
    const { id, createdAt, updatedAt, ...publicSettings } =
      result.data as Record<string, unknown>;
    return { success: true, data: publicSettings };
  }
}

// Singleton instance
export const settingsService = new SettingsService();
