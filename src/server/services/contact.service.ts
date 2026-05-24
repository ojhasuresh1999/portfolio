import { connectToDatabase } from "@/lib/mongodb";
import {
  ContactSubmission,
  ContactConfig,
  User,
  type IContactSubmission,
  type IContactConfig,
  type IContactNote,
  type IContactReply,
} from "@/models";
import { Types } from "mongoose";
import type { ServiceResult } from "../types";
import { emailService } from "./email.service";

// Type definitions for contact form data
interface ContactSubmissionData {
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Contact Service
 * Handles contact form submissions & advanced CRM ticket management
 */
export class ContactService {
  /**
   * Ensure database connection before any operation
   */
  private async ensureConnection(): Promise<void> {
    await connectToDatabase();
  }

  /**
   * Get or initialize CRM configuration
   */
  async getConfig(): Promise<ServiceResult<IContactConfig>> {
    try {
      await this.ensureConnection();
      let config = await ContactConfig.findOne().exec();
      if (!config) {
        config = await ContactConfig.create({});
      }
      return { success: true, data: config };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch config",
      };
    }
  }

  /**
   * Update global CRM configuration
   */
  async updateConfig(
    data: Partial<Omit<IContactConfig, "_id" | "createdAt" | "updatedAt">>,
  ): Promise<ServiceResult<IContactConfig>> {
    try {
      await this.ensureConnection();
      const config = await ContactConfig.findOneAndUpdate(
        {},
        { $set: data },
        { new: true, upsert: true },
      ).exec();
      return { success: true, data: config };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update config",
      };
    }
  }

  /**
   * Submit a new contact form (called from public route)
   */
  async submit(
    data: ContactSubmissionData,
  ): Promise<ServiceResult<{ id: string }>> {
    try {
      await this.ensureConnection();

      // Create with initial details & activity log entry
      const submission = await ContactSubmission.create({
        name: data.name,
        email: data.email,
        subject: data.subject ?? undefined,
        message: data.message,
        ip: data.ip,
        userAgent: data.userAgent,
        status: "new",
        priority: "medium",
        isRead: false,
        activityLog: [
          {
            type: "received",
            actor: "System",
            description: "Message received from public contact form",
            createdAt: new Date(),
          },
        ],
      });

      // Fire-and-forget auto-replies
      const emailVars = {
        name: data.name,
        email: data.email,
        subject: data.subject || "(no subject)",
        message: data.message,
      };

      // 1. Send Auto-Reply to Submitter
      emailService
        .sendTemplateEmail({
          to: data.email,
          templateType: "contact_auto_reply",
          vars: emailVars,
        })
        .catch((err) =>
          console.error("[ContactService] Submitter auto-reply failed:", err),
        );

      // 2. Send notice to Admin
      if (process.env.SENDGRID_FROM_EMAIL || process.env.GMAIL_USER) {
        const adminEmail =
          process.env.SENDGRID_FROM_EMAIL || process.env.GMAIL_USER;
        if (adminEmail) {
          emailService
            .sendTemplateEmail({
              to: adminEmail,
              templateType: "contact_admin_notice",
              vars: emailVars,
            })
            .catch((err) =>
              console.error("[ContactService] Admin notice failed:", err),
            );
        }
      }

      return { success: true, data: { id: submission._id.toString() } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to submit form",
      };
    }
  }

  /**
   * Fetch submissions with pagination, sorting, search, and filters
   */
  async getAllAdvanced(options?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    tag?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    agentId?: string; // Role-based access control restriction
    role?: string; // Admin vs Super Admin vs Agent
  }): Promise<
    ServiceResult<{ items: IContactSubmission[]; total: number; pages: number }>
  > {
    try {
      await this.ensureConnection();

      const page = options?.page ?? 1;
      const limit = Math.min(options?.limit ?? 10, 100);
      const skip = (page - 1) * limit;

      const query: Record<string, unknown> = {};

      // 1. Role-based Access Restriction
      // If the agent is not a SUPER_ADMIN, they can ONLY see tickets assigned to them!
      if (options?.role && options.role !== "SUPER_ADMIN" && options.agentId) {
        query.assignedTo = new Types.ObjectId(options.agentId);
      }

      // 2. Text Search (Name, email, subject, original message content)
      if (options?.search) {
        const searchRegex = new RegExp(options.search, "i");
        query.$or = [
          { name: searchRegex },
          { email: searchRegex },
          { subject: searchRegex },
          { message: searchRegex },
        ];
      }

      // 3. Dropdown Filters
      if (options?.status && options.status !== "all") {
        query.status = options.status;
      }
      if (options?.priority && options.priority !== "all") {
        query.priority = options.priority;
      }
      if (options?.assignedTo && options.assignedTo !== "all") {
        if (options.assignedTo === "unassigned") {
          query.$or = [
            { assignedTo: { $exists: false } },
            { assignedTo: null },
          ];
        } else {
          query.assignedTo = new Types.ObjectId(options.assignedTo);
        }
      }
      if (options?.tag && options.tag !== "all") {
        query.tags = options.tag;
      }

      // 4. Date Range Filter
      if (options?.startDate || options?.endDate) {
        query.createdAt = {};
        if (options.startDate) {
          query.createdAt.$gte = new Date(options.startDate);
        }
        if (options.endDate) {
          query.createdAt.$lte = new Date(options.endDate);
        }
      }

      // 5. Sorting
      const sort: Record<string, 1 | -1> = {};
      const order = options?.sortOrder === "asc" ? 1 : -1;
      if (options?.sortBy) {
        sort[options.sortBy] = order;
      } else {
        sort.createdAt = -1; // Default: newest first
      }

      const [items, total] = await Promise.all([
        ContactSubmission.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean<IContactSubmission[]>()
          .exec(),
        ContactSubmission.countDocuments(query).exec(),
      ]);

      return {
        success: true,
        data: {
          items,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to query tickets",
      };
    }
  }

  /**
   * Get single ticket detail (with previous submissions count/list)
   */
  async getById(
    id: string,
    options?: { agentId?: string; role?: string },
  ): Promise<
    ServiceResult<{
      ticket: IContactSubmission;
      previousTickets: IContactSubmission[];
    }>
  > {
    try {
      await this.ensureConnection();

      const ticket = await ContactSubmission.findById(id).exec();
      if (!ticket) {
        return { success: false, error: "Ticket not found" };
      }

      // Role check: agent only sees their assigned ticket
      if (
        options?.role &&
        options.role !== "SUPER_ADMIN" &&
        ticket.assignedTo?.toString() !== options.agentId
      ) {
        return {
          success: false,
          error: "Forbidden: You are not assigned to this ticket",
        };
      }

      // Fetch other previous tickets by the same submitter email
      const previousTickets = await ContactSubmission.find({
        email: ticket.email,
        _id: { $ne: ticket._id },
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean<IContactSubmission[]>()
        .exec();

      // If opening an unread submission, mark it as read & log action
      if (!ticket.isRead) {
        ticket.isRead = true;
        if (ticket.status === "new") {
          ticket.status = "open";
        }
        ticket.activityLog.push({
          type: "status_change",
          actor: "System",
          description: "Ticket opened and marked as read",
          createdAt: new Date(),
        });
        await ticket.save();
      }

      return { success: true, data: { ticket, previousTickets } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load ticket",
      };
    }
  }

  /**
   * Reply to a submission (send email & record details)
   */
  async replyToSubmission(options: {
    id: string;
    message: string;
    adminId: string;
    adminName: string;
  }): Promise<ServiceResult<IContactSubmission>> {
    try {
      await this.ensureConnection();

      const ticket = await ContactSubmission.findById(options.id).exec();
      if (!ticket) {
        return { success: false, error: "Ticket not found" };
      }

      // Interpolate any basic tags in reply message (like greeting Name)
      const formattedMessage = options.message.replace(
        /\{\{name\}\}/g,
        ticket.name,
      );

      // Render standard Support email format
      const emailHtml = `
      <div style="background-color:#0f172a;color:#cbd5e1;padding:30px;font-family:'Segoe UI',sans-serif;border-radius:10px;border:1px solid rgba(99,102,241,0.2);">
        <h2 style="color:#ffffff;margin-bottom:15px;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:10px;">Support Reply</h2>
        <p style="font-size:16px;font-weight:600;color:#ffffff;margin-top:0;">Hi ${ticket.name},</p>
        <div style="font-size:15px;line-height:1.7;white-space:pre-wrap;color:#cbd5e1;">${formattedMessage}</div>
        <div style="margin-top:30px;padding-top:15px;border-top:1px solid rgba(255,255,255,0.06);font-size:12px;color:#64748b;">
          This reply was sent from our Contact Desk regarding your message:
          <blockquote style="margin:10px 0;padding:10px;background-color:#0a0f1e;border-left:3px solid #6366f1;color:#94a3b8;font-style:italic;">
            "${ticket.message}"
          </blockquote>
        </div>
      </div>`;

      // Send Response Email
      const mailResult = await emailService.sendCustomEmail({
        to: ticket.email,
        subject: ticket.subject
          ? `Re: ${ticket.subject}`
          : "Response from SURESH Support",
        bodyHtml: emailHtml,
        bodyText: `Hi ${ticket.name},\n\n${formattedMessage}\n\n---\nRegarding your message:\n"${ticket.message}"`,
      });

      if (!mailResult.success) {
        return {
          success: false,
          error: `Email delivery failed: ${mailResult.error}`,
        };
      }

      // Record Reply and update ticket status
      const replyObj: IContactReply = {
        senderId: new Types.ObjectId(options.adminId),
        senderName: options.adminName,
        message: formattedMessage,
        createdAt: new Date(),
      };

      ticket.replies.push(replyObj);

      // Auto-advance status if currently open or new
      if (ticket.status === "new" || ticket.status === "open") {
        ticket.status = "in_progress";
      }

      ticket.activityLog.push({
        type: "reply_sent",
        actor: options.adminName,
        description: `Sent email response to ${ticket.email}`,
        createdAt: new Date(),
      });

      await ticket.save();
      return { success: true, data: ticket };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save reply",
      };
    }
  }

  /**
   * Append an internal note
   */
  async addNote(options: {
    id: string;
    content: string;
    adminId: string;
    adminName: string;
  }): Promise<ServiceResult<IContactSubmission>> {
    try {
      await this.ensureConnection();

      const ticket = await ContactSubmission.findById(options.id).exec();
      if (!ticket) {
        return { success: false, error: "Ticket not found" };
      }

      const noteObj: IContactNote = {
        adminId: new Types.ObjectId(options.adminId),
        adminName: options.adminName,
        content: options.content,
        createdAt: new Date(),
      };

      ticket.notes.push(noteObj);

      ticket.activityLog.push({
        type: "note_added",
        actor: options.adminName,
        description: `Added a private internal note`,
        createdAt: new Date(),
      });

      await ticket.save();
      return { success: true, data: ticket };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save internal note",
      };
    }
  }

  /**
   * Update properties (status, priority, assigned agent, tags)
   */
  async updateProperties(options: {
    id: string;
    status?: "new" | "open" | "in_progress" | "resolved" | "closed";
    priority?: "low" | "medium" | "high" | "urgent";
    assignedTo?: string; // agent User ID
    tags?: string[];
    actorName: string;
  }): Promise<ServiceResult<IContactSubmission>> {
    try {
      await this.ensureConnection();

      const ticket = await ContactSubmission.findById(options.id).exec();
      if (!ticket) {
        return { success: false, error: "Ticket not found" };
      }

      // Check Status Change
      if (options.status && ticket.status !== options.status) {
        const oldStatus = ticket.status;
        ticket.status = options.status;
        ticket.activityLog.push({
          type: "status_change",
          actor: options.actorName,
          description: `Changed status from ${oldStatus.toUpperCase()} to ${options.status.toUpperCase()}`,
          createdAt: new Date(),
        });
      }

      // Check Priority Change
      if (options.priority && ticket.priority !== options.priority) {
        const oldPriority = ticket.priority;
        ticket.priority = options.priority;
        ticket.activityLog.push({
          type: "priority_change",
          actor: options.actorName,
          description: `Changed priority from ${oldPriority.toUpperCase()} to ${options.priority.toUpperCase()}`,
          createdAt: new Date(),
        });
      }

      // Check Assignment Change
      if (options.assignedTo !== undefined) {
        const oldAgentIdStr = ticket.assignedTo?.toString();
        if (oldAgentIdStr !== options.assignedTo) {
          if (!options.assignedTo || options.assignedTo === "") {
            ticket.assignedTo = undefined;
            ticket.assignedToName = undefined;
            ticket.activityLog.push({
              type: "assigned",
              actor: options.actorName,
              description: `Unassigned ticket`,
              createdAt: new Date(),
            });
          } else {
            const agent = await User.findById(options.assignedTo).exec();
            if (!agent) {
              return { success: false, error: "Assignee user not found" };
            }
            ticket.assignedTo = agent._id;
            ticket.assignedToName = agent.name || agent.email;
            ticket.activityLog.push({
              type: "assigned",
              actor: options.actorName,
              description: `Assigned ticket to agent ${ticket.assignedToName}`,
              createdAt: new Date(),
            });
          }
        }
      }

      // Check Tag Updates
      if (options.tags !== undefined) {
        const added = options.tags.filter((t) => !ticket.tags.includes(t));
        const removed = ticket.tags.filter((t) => !options.tags!.includes(t));

        ticket.tags = options.tags;

        if (added.length > 0) {
          ticket.activityLog.push({
            type: "tag_added",
            actor: options.actorName,
            description: `Added tags: ${added.join(", ")}`,
            createdAt: new Date(),
          });
        }
        if (removed.length > 0) {
          ticket.activityLog.push({
            type: "tag_removed",
            actor: options.actorName,
            description: `Removed tags: ${removed.join(", ")}`,
            createdAt: new Date(),
          });
        }
      }

      await ticket.save();
      return { success: true, data: ticket };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update properties",
      };
    }
  }

  /**
   * Delete a submission ticket
   */
  async delete(id: string): Promise<ServiceResult<null>> {
    try {
      await this.ensureConnection();
      const res = await ContactSubmission.findByIdAndDelete(id).exec();
      if (!res) {
        return { success: false, error: "Ticket not found" };
      }
      return { success: true, data: null };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete ticket",
      };
    }
  }

  /**
   * Execute bulk operations
   */
  async bulkAction(options: {
    ids: string[];
    action:
      | "mark_read"
      | "mark_unread"
      | "change_status"
      | "change_priority"
      | "assign"
      | "delete";
    value?: string | string[]; // value for status, priority, or agentId
    actorName: string;
  }): Promise<ServiceResult<{ modifiedCount: number }>> {
    try {
      await this.ensureConnection();

      const objectIds = options.ids.map((id) => new Types.ObjectId(id));

      if (options.action === "delete") {
        const res = await ContactSubmission.deleteMany({
          _id: { $in: objectIds },
        }).exec();
        return { success: true, data: { modifiedCount: res.deletedCount } };
      }

      const updateData: Record<string, unknown> = {};
      const auditDescriptionList: string[] = [];

      if (options.action === "mark_read") {
        updateData.isRead = true;
        auditDescriptionList.push("Marked read in bulk");
      } else if (options.action === "mark_unread") {
        updateData.isRead = false;
        auditDescriptionList.push("Marked unread in bulk");
      } else if (options.action === "change_status") {
        updateData.status = options.value;
        auditDescriptionList.push(
          `Status changed in bulk to ${options.value.toUpperCase()}`,
        );
      } else if (options.action === "change_priority") {
        updateData.priority = options.value;
        auditDescriptionList.push(
          `Priority changed in bulk to ${options.value.toUpperCase()}`,
        );
      } else if (options.action === "assign") {
        if (!options.value || options.value === "") {
          updateData.assignedTo = null;
          updateData.assignedToName = null;
          auditDescriptionList.push("Unassigned in bulk");
        } else {
          const agent = await User.findById(options.value).exec();
          if (!agent) {
            return { success: false, error: "Assignee user not found" };
          }
          updateData.assignedTo = agent._id;
          updateData.assignedToName = agent.name || agent.email;
          auditDescriptionList.push(
            `Assigned in bulk to ${updateData.assignedToName}`,
          );
        }
      }

      // Update submissions and append activity log
      const tickets = await ContactSubmission.find({
        _id: { $in: objectIds },
      }).exec();
      for (const t of tickets) {
        for (const [k, v] of Object.entries(updateData)) {
          (t as unknown as Record<string, unknown>)[k] = v;
        }
        for (const desc of auditDescriptionList) {
          t.activityLog.push({
            type: options.action,
            actor: options.actorName,
            description: desc,
            createdAt: new Date(),
          });
        }
        await t.save();
      }

      return { success: true, data: { modifiedCount: tickets.length } };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to execute bulk action",
      };
    }
  }

  /**
   * Get unread notifications polling stats
   */
  async getUnreadPollingStats(): Promise<
    ServiceResult<{ count: number; recent: IContactSubmission[] }>
  > {
    try {
      await this.ensureConnection();
      const count = await ContactSubmission.countDocuments({
        isRead: false,
      }).exec();
      const recent = await ContactSubmission.find({ isRead: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean<IContactSubmission[]>()
        .exec();
      return { success: true, data: { count, recent } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Polling failed",
      };
    }
  }

  /**
   * Aggregate ticket dashboard analytics metrics
   */
  async getStats(options?: { agentId?: string; role?: string }): Promise<
    ServiceResult<{
      total: number;
      newToday: number;
      open: number;
      resolved: number;
      avgResponseTimeHours: number;
      statusDistribution: { name: string; value: number }[];
      priorityDistribution: { name: string; value: number }[];
      timeline: { name: string; value: number }[];
    }>
  > {
    try {
      await this.ensureConnection();

      const query: Record<string, unknown> = {};
      if (options?.role && options.role !== "SUPER_ADMIN" && options.agentId) {
        query.assignedTo = new Types.ObjectId(options.agentId);
      }

      // 1. Basic Counts
      const total = await ContactSubmission.countDocuments(query).exec();

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const newToday = await ContactSubmission.countDocuments({
        ...query,
        createdAt: { $gte: startOfDay },
      }).exec();

      const open = await ContactSubmission.countDocuments({
        ...query,
        status: { $in: ["new", "open", "in_progress"] },
      }).exec();

      const resolved = await ContactSubmission.countDocuments({
        ...query,
        status: { $in: ["resolved", "closed"] },
      }).exec();

      // 2. Average Response Time
      const repliedSubmissions = await ContactSubmission.find({
        ...query,
        "replies.0": { $exists: true },
      })
        .select("createdAt replies")
        .lean()
        .exec();

      let totalResponseTimeMs = 0;
      let repliedCount = 0;

      for (const sub of repliedSubmissions) {
        if (sub.replies && sub.replies.length > 0) {
          const firstReply = sub.replies[0];
          totalResponseTimeMs +=
            firstReply.createdAt.getTime() - sub.createdAt.getTime();
          repliedCount++;
        }
      }

      const avgResponseTimeHours =
        repliedCount > 0
          ? totalResponseTimeMs / repliedCount / (1000 * 60 * 60)
          : 0;

      // 3. Status Distribution
      const statusDistribution = [
        {
          name: "New",
          value: await ContactSubmission.countDocuments({
            ...query,
            status: "new",
          }),
        },
        {
          name: "Open",
          value: await ContactSubmission.countDocuments({
            ...query,
            status: "open",
          }),
        },
        {
          name: "In Progress",
          value: await ContactSubmission.countDocuments({
            ...query,
            status: "in_progress",
          }),
        },
        {
          name: "Resolved",
          value: await ContactSubmission.countDocuments({
            ...query,
            status: "resolved",
          }),
        },
        {
          name: "Closed",
          value: await ContactSubmission.countDocuments({
            ...query,
            status: "closed",
          }),
        },
      ];

      // 4. Priority Distribution
      const priorityDistribution = [
        {
          name: "Low",
          value: await ContactSubmission.countDocuments({
            ...query,
            priority: "low",
          }),
        },
        {
          name: "Medium",
          value: await ContactSubmission.countDocuments({
            ...query,
            priority: "medium",
          }),
        },
        {
          name: "High",
          value: await ContactSubmission.countDocuments({
            ...query,
            priority: "high",
          }),
        },
        {
          name: "Urgent",
          value: await ContactSubmission.countDocuments({
            ...query,
            priority: "urgent",
          }),
        },
      ];

      // 5. Timeline grouping (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentSubmissions = await ContactSubmission.find({
        ...query,
        createdAt: { $gte: thirtyDaysAgo },
      })
        .select("createdAt")
        .lean()
        .exec();

      const dateMap: Record<string, number> = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        dateMap[dateStr] = 0;
      }

      for (const sub of recentSubmissions) {
        const dateStr = sub.createdAt.toISOString().split("T")[0];
        if (dateMap[dateStr] !== undefined) {
          dateMap[dateStr]++;
        }
      }

      const timeline = Object.entries(dateMap)
        .map(([name, value]) => ({ name, value }))
        .reverse();

      return {
        success: true,
        data: {
          total,
          newToday,
          open,
          resolved,
          avgResponseTimeHours: parseFloat(avgResponseTimeHours.toFixed(1)),
          statusDistribution: statusDistribution.filter((d) => d.value > 0),
          priorityDistribution: priorityDistribution.filter((d) => d.value > 0),
          timeline,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load stats",
      };
    }
  }
}

export const contactService = new ContactService();
