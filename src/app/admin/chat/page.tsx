"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useSocket, useOnlineStatus, useNewMessage } from "@/lib/socket-client";
import { useConversations, useMessages } from "@/hooks/queries";
import type {
  ConversationData,
  ChatUserData,
  MessageData,
} from "@/types/socket.types";

// =============================================================================
// Admin Chat Dashboard
// =============================================================================

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isMobileView, setIsMobileView] = useState(false);

  const { isConnected, joinConversation, leaveConversation } = useSocket();

  // Responsive check
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load conversations using custom hook
  const {
    data: conversationData,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useConversations();

  // Load messages for selected conversation using custom hook
  const { data: messagesData } = useMessages(selectedConversation?._id);

  // Sync conversation query data to local state for socket manipulations
  // Local state is needed because socket events modify conversations independently of queries
  const lastQueryConversations = useRef<ConversationData[] | undefined>(
    undefined,
  );
  useEffect(() => {
    if (
      conversationData?.conversations &&
      conversationData.conversations !== lastQueryConversations.current
    ) {
      lastQueryConversations.current = conversationData.conversations;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing query data with local state for socket mutations
      setConversations(conversationData.conversations);
    }
  }, [conversationData]);

  // Sync messages data to local state
  // Local state is needed because socket events add new messages independently of queries
  const lastQueryMessages = useRef<MessageData[] | undefined>(undefined);
  useEffect(() => {
    if (
      messagesData?.messages &&
      messagesData.messages !== lastQueryMessages.current
    ) {
      lastQueryMessages.current = messagesData.messages;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing query data with local state for socket mutations
      setMessages(messagesData.messages);
    }
  }, [messagesData]);

  // Join as admin handled globally by AdminAuthProvider
  // We just wait for connection (handled by useSocket hook auto-connect)

  // Handle online/offline status updates
  useOnlineStatus(
    // onOnline
    useCallback(
      (userId: string) => {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.participant._id === userId
              ? {
                  ...conv,
                  participant: { ...conv.participant, isOnline: true },
                }
              : conv,
          ),
        );
        if (selectedConversation?.participant._id === userId) {
          setSelectedConversation((prev) =>
            prev
              ? {
                  ...prev,
                  participant: { ...prev.participant, isOnline: true },
                }
              : null,
          );
        }
      },
      [selectedConversation],
    ),
    // onOffline
    useCallback(
      (userId: string, lastSeen: Date) => {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.participant._id === userId
              ? {
                  ...conv,
                  participant: {
                    ...conv.participant,
                    isOnline: false,
                    lastSeen,
                  },
                }
              : conv,
          ),
        );
        if (selectedConversation?.participant._id === userId) {
          setSelectedConversation((prev) =>
            prev
              ? {
                  ...prev,
                  participant: {
                    ...prev.participant,
                    isOnline: false,
                    lastSeen,
                  },
                }
              : null,
          );
        }
      },
      [selectedConversation],
    ),
  );

  // Handle new messages to update conversation list
  useNewMessage(
    useCallback(
      (message: MessageData) => {
        // Check if conversation exists in current list
        const exists = conversations.some(
          (c) => c._id === message.conversationId,
        );

        if (!exists) {
          // New conversation! Refetch the list
          refetchConversations();
          return;
        }

        // Update conversation list with new message preview
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv._id === message.conversationId) {
              return {
                ...conv,
                lastMessage: {
                  content: message.content,
                  timestamp: message.createdAt,
                  senderType: message.senderType,
                },
                unreadCount:
                  selectedConversation?._id !== message.conversationId
                    ? {
                        ...conv.unreadCount,
                        admin: conv.unreadCount.admin + 1,
                      }
                    : conv.unreadCount,
              };
            }
            return conv;
          }),
        );
      },
      [selectedConversation, conversations, refetchConversations],
    ),
  );

  // Handle instantly updating conversation list when admin sends a message
  const handleMessageSent = useCallback((message: MessageData) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv._id === message.conversationId) {
          return {
            ...conv,
            lastMessage: {
              content: message.content,
              timestamp: message.createdAt,
              senderType: message.senderType,
            },
          };
        }
        return conv;
      }),
    );
  }, []);

  // Handle conversation selection
  const handleSelectConversation = async (conversation: ConversationData) => {
    // Leave current conversation
    if (selectedConversation) {
      leaveConversation(selectedConversation._id);
    }

    setSelectedConversation(conversation);

    // Reset unread count for this conversation
    setConversations((prev) =>
      prev.map((conv) =>
        conv._id === conversation._id
          ? { ...conv, unreadCount: { ...conv.unreadCount, admin: 0 } }
          : conv,
      ),
    );

    // Join conversation room
    joinConversation(conversation._id);
  };

  // Handle back button (mobile)
  const handleBack = () => {
    if (selectedConversation) {
      leaveConversation(selectedConversation._id);
    }
    setSelectedConversation(null);
    setMessages([]);
  };

  // Admin user data for chat
  const adminUser: ChatUserData = {
    _id: "admin",
    name: "Admin",
    email: "admin@portfolio.com",
    isOnline: true,
    lastSeen: new Date(),
  };

  return (
    <div className="h-[calc(100vh-8rem)] bg-obsidian rounded-xl border border-white/10 overflow-hidden">
      <div className="flex h-full">
        {/* Conversation List */}
        <AnimatePresence>
          {(!isMobileView || !selectedConversation) && (
            <motion.div
              initial={isMobileView ? { x: -100, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1 }}
              exit={isMobileView ? { x: -100, opacity: 0 } : undefined}
              className={`${
                isMobileView ? "w-full" : "w-80"
              } border-r border-white/5 flex flex-col`}
            >
              {/* Header */}
              <div className="px-4 py-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    Conversations
                  </h2>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isConnected ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span className="text-xs text-slate-400">
                      {isConnected ? "Live" : "Offline"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {conversations.length} conversation
                  {conversations.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                <ConversationList
                  conversations={conversations}
                  selectedId={selectedConversation?._id}
                  onSelect={handleSelectConversation}
                  isLoading={isLoadingConversations}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Window */}
        <AnimatePresence>
          {(!isMobileView || selectedConversation) && (
            <motion.div
              initial={isMobileView ? { x: 100, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1 }}
              exit={isMobileView ? { x: 100, opacity: 0 } : undefined}
              className="flex-1 flex flex-col"
            >
              {selectedConversation ? (
                <ChatWindow
                  conversationId={selectedConversation._id}
                  currentUser={adminUser}
                  userType="admin"
                  recipientName={selectedConversation.participant.name}
                  recipientPhoto={selectedConversation.participant.photo}
                  isRecipientOnline={selectedConversation.participant.isOnline}
                  recipientLastSeen={selectedConversation.participant.lastSeen}
                  initialMessages={messages}
                  onBack={isMobileView ? handleBack : undefined}
                  onMessageSent={handleMessageSent}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-slate-600">
                      forum
                    </span>
                    <h3 className="text-lg text-slate-400 mt-4">
                      Select a conversation
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Choose a chat from the list to start messaging
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
