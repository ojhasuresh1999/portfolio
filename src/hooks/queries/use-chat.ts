import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ConversationData, MessageData } from "@/types/socket.types";

// =============================================================================
// Query Keys
// =============================================================================

export const chatKeys = {
  all: ["chat"] as const,
  conversations: () => [...chatKeys.all, "conversations"] as const,
  messages: (conversationId: string) =>
    [...chatKeys.all, "messages", conversationId] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch admin conversations list
 */
export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        conversations: ConversationData[];
      }>("/chat/conversations");
      return response.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds as a fallback
  });
}

/**
 * Fetch messages for a specific conversation
 */
export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId ?? ""),
    queryFn: async () => {
      if (!conversationId) return null;
      const response = await apiClient.get<{
        success: boolean;
        messages: MessageData[];
      }>(`/chat/messages?conversationId=${conversationId}`);
      return response.data;
    },
    enabled: !!conversationId,
  });
}
