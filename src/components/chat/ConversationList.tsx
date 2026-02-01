"use client";

import { motion } from "framer-motion";
import type { ConversationData } from "@/types/socket.types";

// =============================================================================
// Conversation List Component
// =============================================================================

interface ConversationListProps {
  conversations: ConversationData[];
  selectedId?: string;
  onSelect: (conversation: ConversationData) => void;
  isLoading?: boolean;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading = false,
}: ConversationListProps) {
  // Format timestamp
  const formatTime = (date?: Date) => {
    if (!date) return "";
    const now = new Date();
    const msgDate = new Date(date);
    const diff = now.getTime() - msgDate.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) {
      return msgDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    if (days === 1) return "Yesterday";
    if (days < 7)
      return msgDate.toLocaleDateString("en-US", { weekday: "short" });
    return msgDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 animate-pulse"
          >
            <div className="w-12 h-12 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-white/10 rounded" />
              <div className="h-3 w-32 bg-white/10 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <span className="material-symbols-outlined text-5xl text-slate-600">
          forum
        </span>
        <p className="text-slate-500 mt-4">No conversations yet</p>
        <p className="text-slate-600 text-sm">New chats will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {conversations.map((conversation, index) => (
        <motion.button
          key={conversation._id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(conversation)}
          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
            selectedId === conversation._id
              ? "bg-primary/10 border border-primary/20"
              : "hover:bg-white/5"
          }`}
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {conversation.participant.photo ? (
              <img
                src={conversation.participant.photo}
                alt={conversation.participant.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <span className="text-lg font-semibold text-white">
                  {conversation.participant.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {/* Online indicator */}
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card-dark ${
                conversation.participant.isOnline
                  ? "bg-green-500"
                  : "bg-slate-500"
              }`}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium text-white truncate">
                {conversation.participant.name}
              </h3>
              {conversation.lastMessage && (
                <span className="text-xs text-slate-500 flex-shrink-0">
                  {formatTime(conversation.lastMessage.timestamp)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p className="text-sm text-slate-400 truncate">
                {conversation.lastMessage ? (
                  <>
                    {conversation.lastMessage.senderType === "admin" && (
                      <span className="text-primary">You: </span>
                    )}
                    {conversation.lastMessage.content}
                  </>
                ) : (
                  <span className="text-slate-500 italic">No messages yet</span>
                )}
              </p>
              {/* Unread badge */}
              {conversation.unreadCount.admin > 0 && (
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-primary text-black text-xs font-bold rounded-full">
                  {conversation.unreadCount.admin > 9
                    ? "9+"
                    : conversation.unreadCount.admin}
                </span>
              )}
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// =============================================================================
// User Status Badge Component
// =============================================================================

interface UserStatusProps {
  isOnline: boolean;
  lastSeen?: Date;
  size?: "sm" | "md";
}

export function UserStatus({
  isOnline,
  lastSeen,
  size = "md",
}: UserStatusProps) {
  const formatLastSeen = (date?: Date) => {
    if (!date) return "Unknown";
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return new Date(date).toLocaleDateString();
  };

  const sizeClasses = {
    sm: "text-xs gap-1",
    md: "text-sm gap-1.5",
  };

  const dotSizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
  };

  return (
    <div className={`flex items-center ${sizeClasses[size]}`}>
      <span
        className={`rounded-full ${dotSizeClasses[size]} ${
          isOnline ? "bg-green-500" : "bg-slate-500"
        }`}
      />
      <span className={isOnline ? "text-green-400" : "text-slate-500"}>
        {isOnline ? "Online" : formatLastSeen(lastSeen)}
      </span>
    </div>
  );
}
