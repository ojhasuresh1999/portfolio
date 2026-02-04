import { apiClient } from "@/lib/api-client";
import type { MessageData } from "@/types/socket.types";

// =============================================================================
// Chat Client Service - API layer for chat operations
// =============================================================================

/**
 * Join Chat Response
 */
export interface JoinChatResponse {
  success: boolean;
  user?: {
    _id: string;
    name: string;
    email: string;
    photo?: string;
    sessionToken: string;
    conversationId?: string;
    isOnline: boolean;
    lastSeen: string;
  };
  error?: string;
}

/**
 * Get Messages Response
 */
export interface GetMessagesResponse {
  success: boolean;
  messages?: MessageData[];
  total?: number;
  error?: string;
}

/**
 * Join Chat Input
 */
export interface JoinChatInput {
  name: string;
  email: string;
  photo?: string;
}

/**
 * Chat Client Service
 */
class ChatClientServiceClass {
  /**
   * Join chat as a guest user
   */
  async joinChat(data: JoinChatInput): Promise<JoinChatResponse> {
    const response = await apiClient.post<JoinChatResponse>(
      "/chat/users",
      data,
    );
    return response.data;
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    page = 1,
    limit = 50,
  ): Promise<GetMessagesResponse> {
    const sessionToken =
      typeof window !== "undefined"
        ? localStorage.getItem("chat-session-token")
        : null;
    const response = await apiClient.get<GetMessagesResponse>(
      "/chat/messages",
      {
        params: { conversationId, page, limit },
        headers: sessionToken ? { "X-Session-Token": sessionToken } : {},
      },
    );
    return response.data;
  }

  /**
   * Verify session by re-joining (uses same endpoint logic)
   */
  async verifySession(sessionToken: string): Promise<JoinChatResponse> {
    const response = await apiClient.get<JoinChatResponse>("/chat/users/me", {
      headers: {
        "X-Session-Token": sessionToken,
      },
    });
    return response.data;
  }
}

export const ChatClientService = new ChatClientServiceClass();

// =============================================================================
// React Query Keys
// =============================================================================

export const chatKeys = {
  all: ["chat"] as const,
  messages: (conversationId: string) =>
    [...chatKeys.all, "messages", conversationId] as const,
  user: () => [...chatKeys.all, "user"] as const,
};
