import { connectToDatabase } from "@/lib/mongodb";
import { ChatUser, type IChatUser } from "@/models/ChatUser";
import { Conversation } from "@/models/Conversation";
import { randomUUID } from "crypto";
import type { ServiceResult } from "../types";

// =============================================================================
// Chat User Service - Guest user management
// =============================================================================

interface RegisterInput {
  name: string;
  email: string;
  photo?: string;
}

interface ChatUserWithConversation extends IChatUser {
  conversationId?: string;
}

class ChatUserServiceClass {
  /**
   * Register a new guest user or return existing session
   */
  async register(
    data: RegisterInput,
  ): Promise<ServiceResult<ChatUserWithConversation>> {
    try {
      await connectToDatabase();

      // Check if user with this email already has an active session
      const existingUser = await ChatUser.findOne({ email: data.email });

      if (existingUser) {
        // Get their conversation
        const conversation = await Conversation.findOne({
          participant: existingUser._id,
        });

        return {
          success: true,
          data: {
            ...existingUser.toObject(),
            conversationId: conversation?._id.toString(),
          } as ChatUserWithConversation,
        };
      }

      // Create new user with session token
      const sessionToken = randomUUID();

      const user = await ChatUser.create({
        name: data.name,
        email: data.email,
        photo: data.photo,
        sessionToken,
        isOnline: false,
        lastSeen: new Date(),
      });

      // Create conversation for this user
      const conversation = await Conversation.create({
        participant: user._id,
        unreadCount: { admin: 0, user: 0 },
        isActive: true,
      });

      return {
        success: true,
        data: {
          ...user.toObject(),
          conversationId: conversation._id.toString(),
        } as ChatUserWithConversation,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to register user";
      return { success: false, error: message };
    }
  }

  /**
   * Find user by session token
   */
  async findBySession(
    sessionToken: string,
  ): Promise<ServiceResult<ChatUserWithConversation | null>> {
    try {
      await connectToDatabase();

      const user = await ChatUser.findOne({ sessionToken });

      if (!user) {
        return { success: true, data: null };
      }

      const conversation = await Conversation.findOne({
        participant: user._id,
      });

      return {
        success: true,
        data: {
          ...user.toObject(),
          conversationId: conversation?._id.toString(),
        } as ChatUserWithConversation,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to find user";
      return { success: false, error: message };
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<ServiceResult<IChatUser | null>> {
    try {
      await connectToDatabase();
      const user = await ChatUser.findById(id).lean<IChatUser>();
      return { success: true, data: user };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to find user";
      return { success: false, error: message };
    }
  }

  /**
   * Update user online status
   */
  async updateStatus(
    id: string,
    isOnline: boolean,
    socketId?: string,
  ): Promise<ServiceResult<IChatUser>> {
    try {
      await connectToDatabase();

      const updateData: Record<string, unknown> = {
        isOnline,
        lastSeen: new Date(),
      };

      if (socketId !== undefined) {
        updateData.socketId = socketId;
      }

      const user = await ChatUser.findByIdAndUpdate(id, updateData, {
        new: true,
      }).lean<IChatUser>();

      if (!user) {
        return { success: false, error: "User not found" };
      }

      return { success: true, data: user };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update status";
      return { success: false, error: message };
    }
  }

  /**
   * Get all chat users (for admin)
   */
  async findAll(): Promise<ServiceResult<IChatUser[]>> {
    try {
      await connectToDatabase();

      const users = await ChatUser.find()
        .sort({ lastSeen: -1 })
        .lean<IChatUser[]>();

      return { success: true, data: users };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch users";
      return { success: false, error: message };
    }
  }
}

export const ChatUserService = new ChatUserServiceClass();
