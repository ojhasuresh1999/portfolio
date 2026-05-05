import { connectToDatabase } from "@/lib/mongodb";
import { Message, type IMessage } from "@/models/Message";
import { Conversation } from "@/models/Conversation";
import type { ServiceResult, PaginationOptions } from "../types";
import type { MessageData, MessageMedia } from "@/types/socket.types";
import { Pagination } from "../constants";

// =============================================================================
// Message Service
// =============================================================================

interface CreateMessageInput {
  conversationId: string;
  senderId: string;
  senderType: "admin" | "user";
  content: string;
  media?: MessageMedia;
}

class MessageServiceClass {
  /**
   * Create a new message
   */
  async create(data: CreateMessageInput): Promise<ServiceResult<MessageData>> {
    try {
      await connectToDatabase();

      const message = await Message.create({
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderType: data.senderType,
        content: data.content,
        media: data.media,
        reactions: [],
      });

      // Update conversation last message and unread count
      const recipientType = data.senderType === "admin" ? "user" : "admin";
      await Conversation.findByIdAndUpdate(data.conversationId, {
        lastMessage: {
          content: data.content.substring(0, 100),
          timestamp: message.createdAt,
          senderType: data.senderType,
        },
        $inc: { [`unreadCount.${recipientType}`]: 1 },
      });

      const messageData: MessageData = {
        _id: message._id.toString(),
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderType: data.senderType,
        content: message.content,
        media: message.media,
        reactions: [],
        createdAt: message.createdAt,
      };

      // Extract chat user email if they provided one
      if (data.senderType === "user") {
        import("@/models/ChatUser").then(async ({ ChatUser }) => {
          import("@/models/User").then(async ({ User }) => {
            const [chatUser, admin] = await Promise.all([
              ChatUser.findOne({ sessionId: data.senderId }),
              User.findOne({ role: "ADMIN" }),
            ]);

            // 1. Send Admin Notice
            if (process.env.SENDGRID_FROM_EMAIL) {
              const { emailService } = await import("./email.service");
              emailService
                .sendTemplateEmail({
                  to: process.env.SENDGRID_FROM_EMAIL,
                  templateType: "chat_admin_notice",
                  vars: {
                    name: chatUser?.name || "Guest",
                    message: data.content,
                  },
                })
                .catch((err) =>
                  console.error("[MessageService] admin notice failed", err),
                );
            }

            // 2. Send Offline Notice to User if Admin is offline
            if (admin && !admin.isOnline && chatUser && chatUser.email) {
              const { emailService } = await import("./email.service");
              emailService
                .sendTemplateEmail({
                  to: chatUser.email,
                  templateType: "chat_offline_user_notice",
                  vars: {
                    message: data.content,
                  },
                })
                .catch((err) =>
                  console.error("[MessageService] offline notice failed", err),
                );
            }
          });
        });
      }

      return { success: true, data: messageData };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create message";
      return { success: false, error: message };
    }
  }

  /**
   * Get messages for a conversation with pagination
   */
  async findByConversation(
    conversationId: string,
    options?: PaginationOptions,
  ): Promise<ServiceResult<{ messages: MessageData[]; total: number }>> {
    try {
      await connectToDatabase();

      const page = options?.page ?? Pagination.DEFAULT_PAGE;
      const limit = Math.min(options?.limit ?? 50, Pagination.MAX_LIMIT);
      const skip = (page - 1) * limit;

      const [messages, total] = await Promise.all([
        Message.find({ conversationId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean<IMessage[]>(),
        Message.countDocuments({ conversationId }),
      ]);

      const messageData: MessageData[] = messages.map((msg) => ({
        _id: msg._id.toString(),
        conversationId: msg.conversationId.toString(),
        senderId: msg.senderId,
        senderType: msg.senderType,
        content: msg.content,
        media: msg.media,
        reactions: msg.reactions.map((r) => ({
          emoji: r.emoji,
          usersIds: r.userIds,
        })),
        readAt: msg.readAt,
        createdAt: msg.createdAt,
      }));

      // Reverse to get chronological order (newest was first due to sort)
      messageData.reverse();

      return { success: true, data: { messages: messageData, total } };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch messages";
      return { success: false, error: message };
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(
    conversationId: string,
    readerType: "admin" | "user",
  ): Promise<ServiceResult<number>> {
    try {
      await connectToDatabase();

      // Mark messages from the OTHER party as read
      const senderType = readerType === "admin" ? "user" : "admin";

      const result = await Message.updateMany(
        {
          conversationId,
          senderType,
          readAt: null,
        },
        { readAt: new Date() },
      );

      // Reset unread count for reader
      await Conversation.findByIdAndUpdate(conversationId, {
        [`unreadCount.${readerType}`]: 0,
      });

      return { success: true, data: result.modifiedCount };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to mark as read";
      return { success: false, error: message };
    }
  }

  /**
   * Add or toggle reaction on a message
   */
  async toggleReaction(
    messageId: string,
    emoji: string,
    userId: string,
  ): Promise<ServiceResult<IMessage>> {
    try {
      await connectToDatabase();

      const message = await Message.findById(messageId);

      if (!message) {
        return { success: false, error: "Message not found" };
      }

      // Find existing reaction for this emoji
      const existingReaction = message.reactions.find((r) => r.emoji === emoji);

      if (existingReaction) {
        const userIndex = existingReaction.userIds.indexOf(userId);
        if (userIndex > -1) {
          // Remove user from reaction
          existingReaction.userIds.splice(userIndex, 1);
          // Remove reaction if no users left
          if (existingReaction.userIds.length === 0) {
            message.reactions = message.reactions.filter(
              (r) => r.emoji !== emoji,
            );
          }
        } else {
          // Add user to reaction
          existingReaction.userIds.push(userId);
        }
      } else {
        // Create new reaction
        message.reactions.push({
          emoji,
          userIds: [userId],
        });
      }

      await message.save();

      return { success: true, data: message };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to toggle reaction";
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(
    conversationId: string,
    readerType: "admin" | "user",
  ): Promise<ServiceResult<number>> {
    try {
      await connectToDatabase();

      const senderType = readerType === "admin" ? "user" : "admin";

      const count = await Message.countDocuments({
        conversationId,
        senderType,
        readAt: null,
      });

      return { success: true, data: count };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get unread count";
      return { success: false, error: message };
    }
  }
}

export const MessageService = new MessageServiceClass();
