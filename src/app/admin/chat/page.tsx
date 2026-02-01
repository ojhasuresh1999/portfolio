"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useSocket, useOnlineStatus, useNewMessage } from "@/lib/socket-client";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);

  const { isConnected, joinAsAdmin, joinConversation, leaveConversation } =
    useSocket();

  // Responsive check
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await fetch("/api/chat/conversations");
        const data = await response.json();

        if (data.success) {
          setConversations(data.conversations);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, []);

  // Join as admin when connected
  useEffect(() => {
    if (isConnected) {
      joinAsAdmin();
    }
  }, [isConnected, joinAsAdmin]);

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
      [selectedConversation],
    ),
  );

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

    // Load messages for this conversation
    try {
      const response = await fetch(
        `/api/chat/messages?conversationId=${conversation._id}`,
      );
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }

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
                  isLoading={isLoading}
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
