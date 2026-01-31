import prisma from "@/lib/prisma";
import type { ServiceResult } from "../types";

// Type definitions to avoid import from non-existent generated folder
interface ContactSubmissionData {
  name: string;
  email: string;
  subject?: string | null;
  message: string;
}

/**
 * Contact Service
 * Handles contact form submissions
 */
export class ContactService {
  /**
   * Submit a new contact form
   */
  async submit(
    data: ContactSubmissionData,
  ): Promise<ServiceResult<{ id: string }>> {
    try {
      const submission = await prisma.contactSubmission.create({
        data: {
          name: data.name,
          email: data.email,
          subject: data.subject ?? null,
          message: data.message,
        },
      });
      return { success: true, data: { id: submission.id } };
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
  }): Promise<ServiceResult<{ items: unknown[]; total: number }>> {
    try {
      const page = options?.page ?? 1;
      const limit = Math.min(options?.limit ?? 10, 100);
      const skip = (page - 1) * limit;

      const where = options?.unreadOnly ? { isRead: false } : {};

      const [items, total] = await Promise.all([
        prisma.contactSubmission.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.contactSubmission.count({ where }),
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
  async getUnread(): Promise<ServiceResult<unknown[]>> {
    try {
      const submissions = await prisma.contactSubmission.findMany({
        where: { isRead: false },
        orderBy: { createdAt: "desc" },
      });
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
      const count = await prisma.contactSubmission.count({
        where: { isRead: false },
      });
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
  async markAsRead(id: string): Promise<ServiceResult<unknown>> {
    try {
      const submission = await prisma.contactSubmission.update({
        where: { id },
        data: { isRead: true },
      });
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
      const result = await prisma.contactSubmission.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
      return { success: true, data: { count: result.count } };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to mark all as read";
      return { success: false, error: message };
    }
  }

  /**
   * Delete a submission
   */
  async delete(id: string): Promise<ServiceResult<unknown>> {
    try {
      const submission = await prisma.contactSubmission.delete({
        where: { id },
      });
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
