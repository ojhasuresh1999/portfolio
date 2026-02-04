"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  ChatUserData,
  MessageData,
  TypingPayload,
  SendMessagePayload,
  MessageReaction,
} from "@/types/socket.types";

// =============================================================================
// Typed Socket Client
// =============================================================================

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let globalSocket: TypedSocket | null = null;

// =============================================================================
// Socket Client Hook
// =============================================================================

interface UseSocketOptions {
  autoConnect?: boolean;
}

interface UseSocketReturn {
  getSocket: () => TypedSocket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  // User methods
  joinAsUser: (
    sessionToken: string,
  ) => Promise<{ success: boolean; user?: ChatUserData; error?: string }>;
  joinAsAdmin: (token: string) => Promise<{ success: boolean; error?: string }>;
  // Conversation methods
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  // Messaging methods
  sendMessage: (
    data: SendMessagePayload,
  ) => Promise<{ success: boolean; message?: MessageData; error?: string }>;
  markAsRead: (conversationId: string) => void;
  addReaction: (
    messageId: string,
    emoji: string,
  ) => Promise<{
    success: boolean;
    reactions?: MessageReaction[];
    error?: string;
  }>;
  // Typing methods
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
}

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { autoConnect = true } = options;
  const [isConnected, setIsConnected] = useState(
    () => !!globalSocket?.connected,
  );
  const socketRef = useRef<TypedSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // -------------------------------------------------------------------------
  // Connect
  // -------------------------------------------------------------------------
  const connect = useCallback(() => {
    if (globalSocket?.connected) {
      socketRef.current = globalSocket;
      if (!isConnected) {
        setTimeout(() => {
          setIsConnected(true);
        }, 0);
      }
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

    if (!socketUrl) {
      console.error(
        "⚠️ NEXT_PUBLIC_SOCKET_URL is not configured. Socket connection disabled.",
      );
      return;
    }

    globalSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socketRef.current = globalSocket;

    globalSocket.on("connect", () => {
      console.log("🔌 Socket connected:", globalSocket?.id);
      setIsConnected(true);
    });

    globalSocket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setIsConnected(false);
    });

    globalSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });
  }, [isConnected]);

  // -------------------------------------------------------------------------
  // Disconnect
  // -------------------------------------------------------------------------
  const disconnect = useCallback(() => {
    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Auto-connect on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      // Clean up typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [autoConnect, connect]);

  // -------------------------------------------------------------------------
  // User Join (Guest)
  // -------------------------------------------------------------------------
  const joinAsUser = useCallback(
    (
      sessionToken: string,
    ): Promise<{ success: boolean; user?: ChatUserData; error?: string }> => {
      return new Promise((resolve) => {
        if (!socketRef.current?.connected) {
          resolve({ success: false, error: "Not connected" });
          return;
        }

        socketRef.current.emit("user:join", { sessionToken }, (response) => {
          resolve(response);
        });
      });
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Admin Join
  // -------------------------------------------------------------------------
  const joinAsAdmin = useCallback(
    (
      token: string,
    ): Promise<{
      success: boolean;
      error?: string;
    }> => {
      return new Promise((resolve) => {
        if (!socketRef.current?.connected) {
          resolve({ success: false, error: "Not connected" });
          return;
        }

        socketRef.current.emit("admin:join", { token }, (response) => {
          resolve(response);
        });
      });
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Join Conversation
  // -------------------------------------------------------------------------
  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("conversation:join", conversationId);
  }, []);

  // -------------------------------------------------------------------------
  // Leave Conversation
  // -------------------------------------------------------------------------
  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("conversation:leave", conversationId);
  }, []);

  // -------------------------------------------------------------------------
  // Send Message
  // -------------------------------------------------------------------------
  const sendMessage = useCallback(
    (
      data: SendMessagePayload,
    ): Promise<{ success: boolean; message?: MessageData; error?: string }> => {
      return new Promise((resolve) => {
        if (!socketRef.current?.connected) {
          resolve({ success: false, error: "Not connected" });
          return;
        }

        socketRef.current.emit("message:send", data, (response) => {
          resolve(response);
        });
      });
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Mark as Read
  // -------------------------------------------------------------------------
  const markAsRead = useCallback((conversationId: string) => {
    socketRef.current?.emit("message:read", conversationId);
  }, []);

  // -------------------------------------------------------------------------
  // Add Reaction
  // -------------------------------------------------------------------------
  const addReaction = useCallback(
    (
      messageId: string,
      emoji: string,
    ): Promise<{
      success: boolean;
      reactions?: MessageReaction[];
      error?: string;
    }> => {
      return new Promise((resolve) => {
        if (!socketRef.current?.connected) {
          resolve({ success: false, error: "Not connected" });
          return;
        }

        socketRef.current.emit(
          "message:react",
          { messageId, emoji },
          (response) => {
            resolve(response);
          },
        );
      });
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Typing Indicators
  // -------------------------------------------------------------------------
  const startTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit("typing:start", conversationId);

    // Auto-stop typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("typing:stop", conversationId);
    }, 3000);
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketRef.current?.emit("typing:stop", conversationId);
  }, []);

  return {
    getSocket: () => socketRef.current,
    isConnected,
    connect,
    disconnect,
    joinAsUser,
    joinAsAdmin,
    joinConversation,
    leaveConversation,
    sendMessage,
    markAsRead,
    addReaction,
    startTyping,
    stopTyping,
  };
}

// =============================================================================
// Event Listener Hooks
// =============================================================================

export function useSocketEvent<K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K],
) {
  useEffect(() => {
    if (!globalSocket) return;

    globalSocket.on(event, handler as never);

    return () => {
      globalSocket?.off(event, handler as never);
    };
  }, [event, handler]);
}

// =============================================================================
// Specialized Hooks
// =============================================================================

export function useOnlineStatus(
  onOnline?: (userId: string) => void,
  onOffline?: (userId: string, lastSeen: Date) => void,
) {
  useSocketEvent("user:online", (data) => {
    onOnline?.(data.userId);
  });

  useSocketEvent("user:offline", (data) => {
    onOffline?.(data.userId, data.lastSeen!);
  });
}

export function useTypingIndicator(conversationId: string): {
  isTyping: boolean;
  typingUser: string | null;
} {
  const [typingState, setTypingState] = useState<{
    isTyping: boolean;
    typingUser: string | null;
  }>({ isTyping: false, typingUser: null });

  useSocketEvent("user:typing", (data: TypingPayload) => {
    if (data.conversationId === conversationId) {
      setTypingState({ isTyping: true, typingUser: data.userName });
    }
  });

  useSocketEvent("user:stop-typing", (data: TypingPayload) => {
    if (data.conversationId === conversationId) {
      setTypingState({ isTyping: false, typingUser: null });
    }
  });

  return typingState;
}

export function useNewMessage(onNewMessage: (message: MessageData) => void) {
  useSocketEvent("message:new", onNewMessage);
}

export function useMessageReaction(
  onReaction: (messageId: string, reactions: MessageReaction[]) => void,
) {
  useSocketEvent("message:reaction", (data) => {
    onReaction(data.messageId, data.reactions);
  });
}
