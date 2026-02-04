"use client";

import { motion, AnimatePresence } from "framer-motion";
import NextImage from "next/image";
import type { MessageReaction } from "@/types/socket.types";

// =============================================================================
// Message Bubble Component
// =============================================================================

interface MessageBubbleProps {
  id: string;
  content: string;
  senderType: "admin" | "user";
  isOwn: boolean;
  timestamp: Date;
  media?: {
    type: "image" | "file";
    url: string;
    name: string;
  };
  reactions: MessageReaction[];
  isDelivered?: boolean;
  isRead?: boolean;
  onReact?: (messageId: string, emoji: string) => void;
  currentUserId?: string;
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

export function MessageBubble({
  id,
  content,
  senderType,
  isOwn,
  timestamp,
  media,
  reactions,
  isDelivered,
  isRead,
  onReact,
  currentUserId,
}: MessageBubbleProps) {
  const formattedTime = new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3 group`}
    >
      <div className={`relative max-w-[75%] ${isOwn ? "order-2" : "order-1"}`}>
        {/* Message Bubble */}
        <div
          className={`relative rounded-2xl px-4 py-2.5 ${
            isOwn
              ? "bg-gradient-to-r from-primary to-primary/80 text-black rounded-br-md"
              : "bg-white/10 text-white rounded-bl-md"
          }`}
        >
          {/* Sender indicator for admin messages */}
          {!isOwn && senderType === "admin" && (
            <span className="text-xs font-medium text-primary mb-1 block">
              Admin
            </span>
          )}

          {/* Media */}
          {media && (
            <div className="mb-2">
              {media.type === "image" ? (
                <NextImage
                  src={media.url}
                  alt={media.name}
                  width={400}
                  height={300}
                  className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity w-auto h-auto"
                  onClick={() => window.open(media.url, "_blank")}
                />
              ) : (
                <a
                  href={media.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    attach_file
                  </span>
                  <span className="text-sm truncate">{media.name}</span>
                </a>
              )}
            </div>
          )}

          {/* Content */}
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>

          {/* Timestamp and status */}
          <div
            className={`flex items-center gap-1 mt-1 text-xs ${
              isOwn ? "text-black/60 justify-end" : "text-slate-400"
            }`}
          >
            <span>{formattedTime}</span>
            {isOwn && (
              <span
                className={`material-symbols-outlined text-sm ${
                  isRead ? "text-primary" : ""
                }`}
              >
                {isRead ? "done_all" : isDelivered ? "done_all" : "done"}
              </span>
            )}
          </div>
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div
            className={`flex flex-wrap gap-1 mt-1 ${
              isOwn ? "justify-end" : "justify-start"
            }`}
          >
            {reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => onReact?.(id, reaction.emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                  reaction.usersIds.includes(currentUserId || "")
                    ? "bg-primary/20 border border-primary/30"
                    : "bg-white/10 border border-white/10 hover:bg-white/20"
                }`}
              >
                <span>{reaction.emoji}</span>
                <span className="text-white/80">
                  {reaction.usersIds.length}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Reaction Picker (on hover) */}
        <AnimatePresence>
          <div
            className={`opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 ${
              isOwn ? "right-0" : "left-0"
            }`}
          >
            <div className="flex items-center gap-0.5 bg-card-dark/90 backdrop-blur-sm rounded-full px-2 py-1 border border-white/10">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onReact?.(id, emoji)}
                  className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors text-sm"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Typing Indicator Component
// =============================================================================

interface TypingIndicatorProps {
  userName?: string;
}

export function TypingIndicator({ userName }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 mb-3"
    >
      <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {userName || "Someone"} is typing
          </span>
          <div className="flex gap-1">
            <span
              className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Emoji Picker Component
// =============================================================================

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute bottom-full mb-2 right-0 bg-card-dark border border-white/10 rounded-xl p-3 shadow-xl"
    >
      <div className="flex gap-2">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-xl"
          >
            {emoji}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
