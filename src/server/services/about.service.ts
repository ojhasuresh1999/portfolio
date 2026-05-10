import { connectToDatabase } from "@/lib/mongodb";
import {
  AboutContent,
  type IAboutContent,
  TimelineEntry,
  type ITimelineEntry,
} from "@/models";
import type { ServiceResult } from "../types";

// =============================================================================
// Types
// =============================================================================

export interface AboutFormData {
  title?: string;
  subtitle?: string;
  description: string;
  resumeUrl?: string;
  isActive?: boolean;
}

export interface TimelineFormData {
  year: string;
  title: string;
  organizationName?: string;
  organizationUrl?: string;
  description: string;
  order?: number;
  isVisible?: boolean;
}

// =============================================================================
// About Service
// =============================================================================

class AboutService {
  private async ensureConnection(): Promise<void> {
    await connectToDatabase();
  }

  // ---------------------------------------------------------------------------
  // About Content
  // ---------------------------------------------------------------------------

  /**
   * Get active about content (public)
   */
  async getAboutContent(): Promise<ServiceResult<IAboutContent | null>> {
    try {
      await this.ensureConnection();
      const content = await AboutContent.findOne({ isActive: true })
        .lean<IAboutContent>()
        .exec();
      return { success: true, data: content };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch about content";
      return { success: false, error: message };
    }
  }

  /**
   * Get all about content records (admin)
   */
  async getAllAboutContent(): Promise<ServiceResult<IAboutContent[]>> {
    try {
      await this.ensureConnection();
      const items = await AboutContent.find()
        .sort({ createdAt: -1 })
        .lean<IAboutContent[]>()
        .exec();
      return { success: true, data: items };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch about content";
      return { success: false, error: message };
    }
  }

  /**
   * Upsert about content — there is only ever one active record
   */
  async upsertAboutContent(
    data: AboutFormData,
  ): Promise<ServiceResult<IAboutContent>> {
    try {
      await this.ensureConnection();
      const existing = await AboutContent.findOne()
        .sort({ createdAt: 1 })
        .exec();

      if (existing) {
        const updated = await AboutContent.findByIdAndUpdate(
          existing._id,
          { ...data },
          { new: true, runValidators: true },
        )
          .lean<IAboutContent>()
          .exec();
        return { success: true, data: updated! };
      }

      const doc = new AboutContent({ ...data, isActive: true });
      const saved = await doc.save();
      return { success: true, data: saved.toObject() as IAboutContent };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save about content";
      return { success: false, error: message };
    }
  }

  // ---------------------------------------------------------------------------
  // Timeline Entries
  // ---------------------------------------------------------------------------

  /**
   * Get visible timeline entries sorted by order (public)
   */
  async getVisibleTimeline(): Promise<ServiceResult<ITimelineEntry[]>> {
    try {
      await this.ensureConnection();
      const items = await TimelineEntry.find({ isVisible: true })
        .sort({ order: 1 })
        .lean<ITimelineEntry[]>()
        .exec();
      return { success: true, data: items };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch timeline";
      return { success: false, error: message };
    }
  }

  /**
   * Get all timeline entries (admin — includes hidden)
   */
  async getAllTimeline(): Promise<ServiceResult<ITimelineEntry[]>> {
    try {
      await this.ensureConnection();
      const items = await TimelineEntry.find()
        .sort({ order: 1 })
        .lean<ITimelineEntry[]>()
        .exec();
      return { success: true, data: items };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch timeline";
      return { success: false, error: message };
    }
  }

  /**
   * Create a new timeline entry
   */
  async createTimelineEntry(
    data: TimelineFormData,
  ): Promise<ServiceResult<ITimelineEntry>> {
    try {
      await this.ensureConnection();
      const doc = new TimelineEntry(data);
      const saved = await doc.save();
      return { success: true, data: saved.toObject() as ITimelineEntry };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create timeline entry";
      return { success: false, error: message };
    }
  }

  /**
   * Update a timeline entry
   */
  async updateTimelineEntry(
    id: string,
    data: Partial<TimelineFormData>,
  ): Promise<ServiceResult<ITimelineEntry>> {
    try {
      await this.ensureConnection();
      const updated = await TimelineEntry.findByIdAndUpdate(
        id,
        { ...data },
        { new: true, runValidators: true },
      )
        .lean<ITimelineEntry>()
        .exec();

      if (!updated) return { success: false, error: "Record not found" };
      return { success: true, data: updated };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update timeline entry";
      return { success: false, error: message };
    }
  }

  /**
   * Delete a timeline entry
   */
  async deleteTimelineEntry(
    id: string,
  ): Promise<ServiceResult<ITimelineEntry>> {
    try {
      await this.ensureConnection();
      const deleted = await TimelineEntry.findByIdAndDelete(id)
        .lean<ITimelineEntry>()
        .exec();

      if (!deleted) return { success: false, error: "Record not found" };
      return { success: true, data: deleted };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete timeline entry";
      return { success: false, error: message };
    }
  }
}

export const aboutService = new AboutService();
