import { connectToDatabase } from "@/lib/mongodb";
import { SiteSettings, type ISiteSettings } from "@/models";
import type { ServiceResult } from "../types";

/**
 * Site Settings Service
 * Handles site-wide configuration
 */
export class SettingsService {
  /**
   * Ensure database connection before any operation
   */
  private async ensureConnection(): Promise<void> {
    await connectToDatabase();
  }

  /**
   * Get current site settings
   * Returns the first settings record or creates default if none exists
   */
  async get(): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      await this.ensureConnection();

      let settings = await SiteSettings.findOne().lean<ISiteSettings>();

      // Create default settings if none exist
      if (!settings) {
        const created = await SiteSettings.create({
          siteName: "DEV_IO",
          siteTagline: "Backend Developer Portfolio",
          logoText: "DEV_IO",
          statusText: "System Online",
          footerLatency: "12ms",
        });
        settings = created.toObject();
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
      await this.ensureConnection();

      // Get existing settings first
      const existing = await SiteSettings.findOne().lean();

      if (!existing) {
        // Create if doesn't exist
        const settings = await SiteSettings.create(data);
        return {
          success: true,
          data: settings.toObject() as unknown as Record<string, unknown>,
        };
      }

      // Update existing
      const settings = await SiteSettings.findByIdAndUpdate(
        existing._id,
        data,
        { new: true, runValidators: true },
      ).lean<ISiteSettings>();

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
    const {
      _id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      __v: _v,
      ...publicSettings
    } = result.data as Record<string, unknown>;

    return { success: true, data: publicSettings };
  }
}

// Singleton instance
export const settingsService = new SettingsService();
