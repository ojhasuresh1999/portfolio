"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NextImage from "next/image";
import { MessageBubble, TypingIndicator } from "./MessageBubble";
import {
  useSocket,
  useNewMessage,
  useTypingIndicator,
  useMessageReaction,
} from "@/lib/socket-client";
import type {
  MessageData,
  ChatUserData,
  SendMessagePayload,
} from "@/types/socket.types";

// =============================================================================
// Chat Window Component
// =============================================================================

interface ChatWindowProps {
  conversationId: string;
  currentUser: ChatUserData;
  userType: "admin" | "user";
  recipientName?: string;
  recipientPhoto?: string;
  isRecipientOnline?: boolean;
  recipientLastSeen?: Date;
  initialMessages?: MessageData[];
  onBack?: () => void;
}

export function ChatWindow({
  conversationId,
  currentUser,
  userType,
  recipientName = "Chat Support",
  recipientPhoto,
  isRecipientOnline = false,
  recipientLastSeen,
  initialMessages = [],
  onBack,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<MessageData[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isConnected,
    sendMessage,
    addReaction,
    startTyping,
    stopTyping,
    joinConversation,
    leaveConversation,
    markAsRead,
  } = useSocket();

  const { isTyping, typingUser } = useTypingIndicator(conversationId);

  // Sync messages when initialMessages prop changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Join conversation on mount
  useEffect(() => {
    if (isConnected && conversationId) {
      joinConversation(conversationId);
      markAsRead(conversationId);
    }

    return () => {
      if (conversationId) {
        leaveConversation(conversationId);
      }
    };
  }, [
    isConnected,
    conversationId,
    joinConversation,
    leaveConversation,
    markAsRead,
  ]);

  // Handle new messages
  useNewMessage(
    useCallback(
      (message: MessageData) => {
        if (message.conversationId === conversationId) {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m._id === message._id)) return prev;
            return [...prev, message];
          });
          markAsRead(conversationId);
        }
      },
      [conversationId, markAsRead],
    ),
  );

  // Handle reactions
  useMessageReaction(
    useCallback((messageId: string, reactions) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg,
        ),
      );
    }, []),
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    startTyping(conversationId);
  };

  // Handle send message
  const handleSend = async () => {
    const trimmedContent = inputValue.trim();
    if (!trimmedContent && !mediaFile) return;

    setIsSending(true);
    stopTyping(conversationId);

    try {
      const payload: SendMessagePayload = {
        conversationId,
        content: trimmedContent || "📎 Attachment",
      };

      // Handle media upload
      if (mediaFile && mediaPreview) {
        payload.media = {
          type: mediaFile.type.startsWith("image/") ? "image" : "file",
          url: mediaPreview,
          name: mediaFile.name,
          size: mediaFile.size,
        };
      }

      const result = await sendMessage(payload);

      if (result.success && result.message) {
        setInputValue("");
        setMediaPreview(null);
        setMediaFile(null);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setMediaFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setMediaPreview(file.name);
    }
  };

  // Handle reaction
  const handleReact = async (messageId: string, emoji: string) => {
    await addReaction(messageId, emoji);
  };

  // Format last seen
  const formatLastSeen = (date?: Date) => {
    if (!date) return "";
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-obsidian">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 bg-card-dark/80 backdrop-blur-md border-b border-white/5">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}

        {/* Recipient info */}
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            {recipientPhoto ? (
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                <NextImage
                  src={recipientPhoto}
                  alt={recipientName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">
                  {userType === "user" ? "support_agent" : "person"}
                </span>
              </div>
            )}
            {/* Online indicator */}
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card-dark ${
                isRecipientOnline ? "bg-green-500" : "bg-slate-500"
              }`}
            />
          </div>

          <div>
            <h2 className="font-semibold text-white">{recipientName}</h2>
            <p className="text-xs text-slate-400">
              {isRecipientOnline
                ? "Online"
                : `Last seen ${formatLastSeen(recipientLastSeen)}`}
            </p>
          </div>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-xs text-slate-400">
            {isConnected ? "Connected" : "Reconnecting..."}
          </span>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-1">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl text-slate-600">
                chat_bubble_outline
              </span>
              <p className="text-slate-500 mt-4">
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <MessageBubble
                key={message._id}
                id={message._id}
                content={message.content}
                senderType={message.senderType}
                isOwn={
                  userType === "admin"
                    ? message.senderType === "admin"
                    : message.senderId === currentUser._id
                }
                timestamp={message.createdAt}
                media={message.media}
                reactions={message.reactions}
                isDelivered={true}
                isRead={!!message.readAt}
                onReact={handleReact}
                currentUserId={currentUser._id}
              />
            ))}
          </AnimatePresence>
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && <TypingIndicator userName={typingUser || undefined} />}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Media Preview */}
      <AnimatePresence>
        {mediaPreview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-6 py-3 bg-card-dark border-t border-white/5"
          >
            <div className="flex items-center gap-3">
              {mediaFile?.type.startsWith("image/") ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                  <NextImage
                    src={mediaPreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-slate-400">
                    attach_file
                  </span>
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm text-white truncate">{mediaFile?.name}</p>
                <p className="text-xs text-slate-400">
                  {mediaFile && Math.round(mediaFile.size / 1024)}KB
                </p>
              </div>
              <button
                onClick={() => {
                  setMediaPreview(null);
                  setMediaFile(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="px-6 py-4 bg-card-dark/80 backdrop-blur-md border-t border-white/5">
        <div className="flex items-end gap-3">
          {/* Attachment button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <span className="material-symbols-outlined">attach_file</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Message input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              onBlur={() => stopTyping(conversationId)}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-32"
              style={{ minHeight: "48px" }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={isSending || (!inputValue.trim() && !mediaFile)}
            className="p-3 bg-gradient-to-r from-primary to-secondary rounded-xl transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <span className="material-symbols-outlined animate-spin text-black">
                progress_activity
              </span>
            ) : (
              <span className="material-symbols-outlined text-black">send</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
