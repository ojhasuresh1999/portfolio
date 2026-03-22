import { connectToDatabase } from "@/lib/mongodb";
import { SocialLink, type ISocialLink } from "@/models";
import type { ServiceResult } from "../types";

export class SocialLinksService {
  private async ensureConnection(): Promise<void> {
    await connectToDatabase();
  }

  /**
   * Get all social links ordered by 'order'
   */
  async getAll(): Promise<ServiceResult<Record<string, unknown>[]>> {
    try {
      await this.ensureConnection();
      const links = await SocialLink.find().sort({ order: 1 }).lean();

      return {
        success: true,
        data: links.map((l) => ({
          ...l,
          _id: l._id.toString(),
        })) as unknown as Record<string, unknown>[],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch social links";
      return { success: false, error: message };
    }
  }

  /**
   * Bulk update/replace all social links
   */
  async bulkUpdate(
    linksData: Partial<ISocialLink>[],
  ): Promise<ServiceResult<Record<string, unknown>[]>> {
    try {
      await this.ensureConnection();

      // Delete all existing
      await SocialLink.deleteMany({});

      // Insert new links with order applied automatically if not present
      const linksToInsert = linksData.map((link, index) => ({
        platform: link.platform,
        url: link.url,
        icon: link.icon,
        isVisible: link.isVisible ?? true,
        order: link.order ?? index,
      }));

      const inserted = await SocialLink.insertMany(linksToInsert);

      return {
        success: true,
        data: inserted.map((l) => l.toObject()) as unknown as Record<
          string,
          unknown
        >[],
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update social links";
      return { success: false, error: message };
    }
  }
}

export const socialLinksService = new SocialLinksService();
