import { connectToDatabase } from "@/lib/mongodb";
import { ContactSubmission } from "@/models";
import type { ServiceResult } from "../types";

// Type definitions for contact form data
interface ContactSubmissionData {
  name: string;
  email: string;
  subject?: string | null;
  message: string;
}

// Return type for lean queries
interface ContactSubmissionDoc {
  _id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

/**
 * Contact Service
 * Handles contact form submissions
 */
export class ContactService {
  /**
   * Ensure database connection before any operation
   */
  private async ensureConnection(): Promise<void> {
    await connectToDatabase();
  }

  /**
   * Submit a new contact form
   */
  async submit(
    data: ContactSubmissionData,
  ): Promise<ServiceResult<{ id: string }>> {
    try {
      await this.ensureConnection();

      const submission = await ContactSubmission.create({
        name: data.name,
        email: data.email,
        subject: data.subject ?? undefined,
        message: data.message,
      });

      return { success: true, data: { id: submission._id.toString() } };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit contact form";
      return { success: false, error: message };
    }
  }

  /**
   * Get all submissions with pagination
   */
  async getAll(options?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<ServiceResult<{ items: ContactSubmissionDoc[]; total: number }>> {
    try {
      await this.ensureConnection();

      const page = options?.page ?? 1;
      const limit = Math.min(options?.limit ?? 10, 100);
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (options?.unreadOnly) {
        where.isRead = false;
      }

      const [items, total] = await Promise.all([
        ContactSubmission.find(where)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean<ContactSubmissionDoc[]>()
          .exec(),
        ContactSubmission.countDocuments(where).exec(),
      ]);

      return { success: true, data: { items, total } };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch submissions";
      return { success: false, error: message };
    }
  }

  /**
   * Get unread submissions
   */
  async getUnread(): Promise<ServiceResult<ContactSubmissionDoc[]>> {
    try {
      await this.ensureConnection();

      const submissions = await ContactSubmission.find({ isRead: false })
        .sort({ createdAt: -1 })
        .lean<ContactSubmissionDoc[]>()
        .exec();

      return { success: true, data: submissions };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch unread submissions";
      return { success: false, error: message };
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<ServiceResult<number>> {
    try {
      await this.ensureConnection();

      const count = await ContactSubmission.countDocuments({
        isRead: false,
      }).exec();
      return { success: true, data: count };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get unread count";
      return { success: false, error: message };
    }
  }

  /**
   * Mark a submission as read
   */
  async markAsRead(id: string): Promise<ServiceResult<ContactSubmissionDoc>> {
    try {
      await this.ensureConnection();

      const submission = await ContactSubmission.findByIdAndUpdate(
        id,
        { isRead: true },
        { new: true },
      )
        .lean<ContactSubmissionDoc>()
        .exec();

      if (!submission) {
        return { success: false, error: "Submission not found" };
      }

      return { success: true, data: submission };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to mark as read";
      return { success: false, error: message };
    }
  }

  /**
   * Mark all submissions as read
   */
  async markAllAsRead(): Promise<ServiceResult<{ count: number }>> {
    try {
      await this.ensureConnection();

      const result = await ContactSubmission.updateMany(
        { isRead: false },
        { isRead: true },
      ).exec();

      return { success: true, data: { count: result.modifiedCount } };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to mark all as read";
      return { success: false, error: message };
    }
  }

  /**
   * Delete a submission
   */
  async delete(id: string): Promise<ServiceResult<ContactSubmissionDoc>> {
    try {
      await this.ensureConnection();

      const submission = await ContactSubmission.findByIdAndDelete(id)
        .lean<ContactSubmissionDoc>()
        .exec();

      if (!submission) {
        return { success: false, error: "Submission not found" };
      }

      return { success: true, data: submission };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete submission";
      return { success: false, error: message };
    }
  }
}

// Singleton instance
export const contactService = new ContactService();
