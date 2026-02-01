import { connectToDatabase } from "@/lib/mongodb";
import { Conversation, type IConversation } from "@/models/Conversation";
import { ChatUser } from "@/models/ChatUser";
import type { ServiceResult } from "../types";
import type { ConversationData, ChatUserData } from "@/types/socket.types";

// =============================================================================
// Conversation Service
// =============================================================================

class ConversationServiceClass {
  /**
   * Create a new conversation for a chat user
   */
  async create(participantId: string): Promise<ServiceResult<IConversation>> {
    try {
      await connectToDatabase();

      // Check if conversation already exists
      const existing = await Conversation.findOne({
        participant: participantId,
      });
      if (existing) {
        return { success: true, data: existing };
      }

      const conversation = await Conversation.create({
        participant: participantId,
        unreadCount: { admin: 0, user: 0 },
        isActive: true,
      });

      return { success: true, data: conversation };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create conversation";
      return { success: false, error: message };
    }
  }

  /**
   * Find conversation by participant
   */
  async findByParticipant(
    participantId: string,
  ): Promise<ServiceResult<IConversation | null>> {
    try {
      await connectToDatabase();
      const conversation = await Conversation.findOne({
        participant: participantId,
      }).lean<IConversation>();
      return { success: true, data: conversation };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to find conversation";
      return { success: false, error: message };
    }
  }

  /**
   * Find conversation by ID
   */
  async findById(id: string): Promise<ServiceResult<IConversation | null>> {
    try {
      await connectToDatabase();
      const conversation =
        await Conversation.findById(id).lean<IConversation>();
      return { success: true, data: conversation };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to find conversation";
      return { success: false, error: message };
    }
  }

  /**
   * Get all conversations with participant info (for admin)
   */
  async findAllWithParticipants(): Promise<ServiceResult<ConversationData[]>> {
    try {
      await connectToDatabase();

      const conversations = await Conversation.find({ isActive: true })
        .sort({ updatedAt: -1 })
        .lean<IConversation[]>();

      // Fetch all participants
      const participantIds = conversations.map((c) => c.participant);
      const participants = await ChatUser.find({
        _id: { $in: participantIds },
      }).lean();

      const participantMap = new Map(
        participants.map((p) => [p._id.toString(), p]),
      );

      const conversationsWithParticipants: ConversationData[] =
        conversations.map((conv) => {
          const participant = participantMap.get(conv.participant.toString());

          const participantData: ChatUserData = {
            _id: participant?._id.toString() || "",
            name: participant?.name || "Unknown",
            email: participant?.email || "",
            photo: participant?.photo,
            isOnline: participant?.isOnline || false,
            lastSeen: participant?.lastSeen || new Date(),
          };

          return {
            _id: conv._id.toString(),
            participant: participantData,
            lastMessage: conv.lastMessage
              ? {
                  content: conv.lastMessage.content,
                  timestamp: conv.lastMessage.timestamp,
                  senderType: conv.lastMessage.senderType,
                }
              : undefined,
            unreadCount: conv.unreadCount,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
          };
        });

      return { success: true, data: conversationsWithParticipants };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch conversations";
      return { success: false, error: message };
    }
  }

  /**
   * Update last message in conversation
   */
  async updateLastMessage(
    conversationId: string,
    content: string,
    senderType: "admin" | "user",
  ): Promise<ServiceResult<IConversation>> {
    try {
      await connectToDatabase();

      const updateData = {
        lastMessage: {
          content: content.substring(0, 100),
          timestamp: new Date(),
          senderType,
        },
      };

      const conversation = await Conversation.findByIdAndUpdate(
        conversationId,
        updateData,
        { new: true },
      ).lean<IConversation>();

      if (!conversation) {
        return { success: false, error: "Conversation not found" };
      }

      return { success: true, data: conversation };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update conversation";
      return { success: false, error: message };
    }
  }

  /**
   * Reset unread count for a user type
   */
  async resetUnreadCount(
    conversationId: string,
    userType: "admin" | "user",
  ): Promise<ServiceResult<IConversation>> {
    try {
      await connectToDatabase();

      const conversation = await Conversation.findByIdAndUpdate(
        conversationId,
        { [`unreadCount.${userType}`]: 0 },
        { new: true },
      ).lean<IConversation>();

      if (!conversation) {
        return { success: false, error: "Conversation not found" };
      }

      return { success: true, data: conversation };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reset unread count";
      return { success: false, error: message };
    }
  }

  /**
   * Increment unread count
   */
  async incrementUnreadCount(
    conversationId: string,
    userType: "admin" | "user",
  ): Promise<ServiceResult<IConversation>> {
    try {
      await connectToDatabase();

      const conversation = await Conversation.findByIdAndUpdate(
        conversationId,
        { $inc: { [`unreadCount.${userType}`]: 1 } },
        { new: true },
      ).lean<IConversation>();

      if (!conversation) {
        return { success: false, error: "Conversation not found" };
      }

      return { success: true, data: conversation };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to increment unread";
      return { success: false, error: message };
    }
  }
}

export const ConversationService = new ConversationServiceClass();
