"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useSocket,
  useNewMessage,
  useTypingIndicator,
} from "@/lib/socket-client";
import type { ChatUserData, MessageData } from "@/types/socket.types";

// =============================================================================
// Terminal-Style Floating Chat Widget with Modal Support
// =============================================================================

const SESSION_KEY = "chat-session-token";
const USER_KEY = "chat-user-data";

const joinSchema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
});

type JoinFormData = z.infer<typeof joinSchema>;

// Traffic Light Button Component
function TrafficLight({
  color,
  icon,
  onClick,
}: {
  color: "red" | "yellow" | "green";
  icon: string;
  onClick: () => void;
}) {
  const bgColor = {
    red: "bg-red-500 hover:bg-red-400",
    yellow: "bg-yellow-500 hover:bg-yellow-400",
    green: "bg-green-500 hover:bg-green-400",
  }[color];

  return (
    <button
      onClick={onClick}
      className={`group w-3.5 h-3.5 rounded-full ${bgColor} transition-colors flex items-center justify-center`}
    >
      <span className="text-[8px] font-bold text-black/0 group-hover:text-black/80 transition-colors">
        {icon}
      </span>
    </button>
  );
}

// Chat Content Component (shared between widget and modal)
function ChatContent({
  user,
  messages,
  inputValue,
  setInputValue,
  isTyping,
  isSending,
  isJoining,
  onSend,
  onLeave,
  onJoin,
  conversationId,
  startTyping,
  stopTyping,
  messagesEndRef,
  register,
  handleSubmit,
  errors,
  isModal = false,
}: {
  user: ChatUserData | null;
  messages: MessageData[];
  inputValue: string;
  setInputValue: (v: string) => void;
  isTyping: boolean;
  isSending: boolean;
  isJoining: boolean;
  onSend: () => void;
  onLeave: () => void;
  onJoin: (data: JoinFormData) => void;
  conversationId: string | null;
  startTyping: (id: string) => void;
  stopTyping: (id: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  register: ReturnType<typeof useForm<JoinFormData>>["register"];
  handleSubmit: ReturnType<typeof useForm<JoinFormData>>["handleSubmit"];
  errors: ReturnType<typeof useForm<JoinFormData>>["formState"]["errors"];
  isModal?: boolean;
}) {
  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {!user ? (
        // Join Form
        <div className={`flex-1 p-${isModal ? "6" : "4"}`}>
          <div className="mb-4">
            <p
              className={`text-${isModal ? "sm" : "xs"} font-mono text-primary mb-1`}
            >
              {">"} INITIALIZE_CONNECTION
            </p>
            <p className={`text-${isModal ? "sm" : "xs"} text-slate-400`}>
              Enter your credentials to start chat session
            </p>
          </div>

          <form onSubmit={handleSubmit(onJoin)} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase">
                user.name
              </label>
              <input
                {...register("name")}
                placeholder="Enter name..."
                className={`w-full mt-1 px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg ${isModal ? "text-base" : "text-sm"} text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 font-mono`}
              />
              {errors.name && (
                <p className="text-red-400 text-[10px] mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase">
                user.email
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="Enter email..."
                className={`w-full mt-1 px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg ${isModal ? "text-base" : "text-sm"} text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 font-mono`}
              />
              {errors.email && (
                <p className="text-red-400 text-[10px] mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isJoining}
              className={`w-full py-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-primary ${isModal ? "text-base" : "text-sm"} font-mono transition-all disabled:opacity-50`}
            >
              {isJoining ? "CONNECTING..." : "$ connect --start"}
            </button>
          </form>
        </div>
      ) : (
        // Chat Messages
        <>
          {/* User info bar */}
          <div
            className={`px-${isModal ? "6" : "4"} py-2 bg-slate-800/50 border-b border-slate-700/50 flex items-center justify-between`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500">
                session:
              </span>
              <span
                className={`${isModal ? "text-sm" : "text-xs"} font-mono text-primary`}
              >
                {user.name}
              </span>
            </div>
            <button
              onClick={onLeave}
              className="text-[10px] font-mono text-red-400 hover:text-red-300"
            >
              disconnect
            </button>
          </div>

          {/* Messages */}
          <div
            className={`flex-1 overflow-y-auto p-${isModal ? "6" : "4"} space-y-3 no-scrollbar`}
          >
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <span
                  className={`${isModal ? "text-sm" : "text-xs"} font-mono text-slate-500`}
                >
                  {">"} No messages. Start the conversation!
                </span>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${
                    msg.senderType === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] ${
                      msg.senderType === "user"
                        ? "bg-primary/10 border-primary/20"
                        : "bg-slate-800/80 border-slate-700"
                    } border rounded-lg px-3 py-2`}
                  >
                    <p
                      className={`${isModal ? "text-base" : "text-sm"} text-white break-words`}
                    >
                      {msg.content}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 mt-1">
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                    <span
                      className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className={`p-${isModal ? "4" : "3"} bg-slate-950/90 border-t border-slate-800`}
          >
            <div
              className={`flex items-center gap-2 bg-slate-800/50 rounded-lg border border-slate-700 px-3 py-${isModal ? "3" : "2"}`}
            >
              <span
                className={`text-primary font-mono ${isModal ? "text-base" : "text-sm"}`}
              >
                {">"}
              </span>
              <input
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (conversationId) startTyping(conversationId);
                }}
                onBlur={() => conversationId && stopTyping(conversationId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                placeholder="Enter message..."
                className={`flex-1 bg-transparent ${isModal ? "text-base" : "text-sm"} text-white placeholder-slate-500 focus:outline-none font-mono`}
              />
              <button
                onClick={onSend}
                disabled={isSending || !inputValue.trim()}
                className="text-primary hover:text-primary/80 disabled:opacity-50"
              >
                <span
                  className={`material-symbols-outlined ${isModal ? "text-xl" : "text-lg"}`}
                >
                  send
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<ChatUserData | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    isConnected,
    joinAsUser,
    sendMessage,
    joinConversation,
    startTyping,
    stopTyping,
    markAsRead,
  } = useSocket();

  const { isTyping } = useTypingIndicator(conversationId || "");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
  });

  // Check existing session
  useEffect(() => {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    const userData = localStorage.getItem(USER_KEY);
    if (sessionToken && userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setConversationId(parsed.conversationId);
      } catch {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
  }, []);

  // Listen for open-chat-widget event
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener("open-chat-widget", handleOpenChat);
    return () => window.removeEventListener("open-chat-widget", handleOpenChat);
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId && (isOpen || isModalOpen)) {
      fetch(`/api/chat/messages?conversationId=${conversationId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setMessages(data.messages);
        });

      if (isConnected) {
        joinConversation(conversationId);
        markAsRead(conversationId);
      }
    }
  }, [
    conversationId,
    isOpen,
    isModalOpen,
    isConnected,
    joinConversation,
    markAsRead,
  ]);

  // Socket connection
  useEffect(() => {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    if (isConnected && sessionToken && user) {
      joinAsUser(sessionToken);
    }
  }, [isConnected, user, joinAsUser]);

  // New messages
  useNewMessage(
    useCallback(
      (message: MessageData) => {
        if (message.conversationId === conversationId) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === message._id)) return prev;
            return [...prev, message];
          });
          if (isOpen || isModalOpen) markAsRead(conversationId!);
        }
      },
      [conversationId, isOpen, isModalOpen, markAsRead],
    ),
  );

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Join chat
  const onJoin = async (data: JoinFormData) => {
    setIsJoining(true);
    try {
      const res = await fetch("/api/chat/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        localStorage.setItem(SESSION_KEY, result.user.sessionToken);
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));
        setUser(result.user);
        setConversationId(result.user.conversationId);
        if (isConnected) joinAsUser(result.user.sessionToken);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsJoining(false);
    }
  };

  // Send message
  const handleSend = async () => {
    if (!inputValue.trim() || !conversationId) return;
    setIsSending(true);
    stopTyping(conversationId);
    try {
      const result = await sendMessage({
        conversationId,
        content: inputValue.trim(),
      });
      if (result.success) setInputValue("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  // Leave chat
  const handleLeave = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setConversationId(null);
    setMessages([]);
  };

  // Open modal and close widget
  const handleOpenModal = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setIsModalOpen(true);
  };

  // Close modal and re-open widget
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsOpen(true);
  };

  // Terminal Header Component
  const TerminalHeader = ({ isModal = false }: { isModal?: boolean }) => (
    <div
      className={`flex items-center justify-between px-4 py-3 bg-slate-950/90 border-b border-primary/10`}
    >
      <div className="flex items-center gap-3">
        {/* Traffic lights with hover icons */}
        <div className="flex items-center gap-1.5">
          <TrafficLight
            color="red"
            icon="×"
            onClick={() => (isModal ? setIsModalOpen(false) : setIsOpen(false))}
          />
          <TrafficLight
            color="yellow"
            icon="−"
            onClick={() =>
              isModal ? handleCloseModal() : setIsMinimized(!isMinimized)
            }
          />
          <TrafficLight
            color="green"
            icon="⤢"
            onClick={() => (isModal ? handleCloseModal() : handleOpenModal())}
          />
        </div>
        {/* Title */}
        <div className="flex items-center gap-2">
          <span
            className={`material-symbols-outlined ${isModal ? "text-base" : "text-sm"} text-primary`}
          >
            terminal
          </span>
          <span
            className={`${isModal ? "text-sm" : "text-xs"} font-mono text-slate-400`}
          >
            CHAT_TERMINAL
          </span>
        </div>
      </div>
      {/* Status */}
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span
          className={`${isModal ? "text-xs" : "text-[10px]"} font-mono text-slate-500`}
        >
          {isConnected ? "ONLINE" : "OFFLINE"}
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 ${isOpen || isModalOpen ? "hidden" : "flex"}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
          {/* Glow */}
          <div className="absolute inset-0 bg-primary/30 rounded-xl blur-lg animate-pulse" />
          {/* Button */}
          <div className="relative w-14 h-14 bg-gradient-to-br from-slate-900 to-slate-800 border border-primary/30 rounded-xl flex items-center justify-center shadow-xl hover:border-primary/50 transition-all">
            <span className="material-symbols-outlined text-2xl text-primary">
              chat
            </span>
          </div>
          {/* Pulse indicator */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary" />
          </span>
        </div>
      </motion.button>

      {/* Terminal-Style Chat Widget */}
      <AnimatePresence>
        {isOpen && !isModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? "auto" : "500px",
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-slate-900/95 backdrop-blur-xl border border-primary/20 rounded-xl shadow-2xl shadow-primary/10 overflow-hidden flex flex-col"
          >
            <TerminalHeader />
            <AnimatePresence mode="wait">
              {!isMinimized && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <ChatContent
                    user={user}
                    messages={messages}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    isTyping={isTyping}
                    isSending={isSending}
                    isJoining={isJoining}
                    onSend={handleSend}
                    onLeave={handleLeave}
                    onJoin={onJoin}
                    conversationId={conversationId}
                    startTyping={startTyping}
                    stopTyping={stopTyping}
                    messagesEndRef={messagesEndRef}
                    register={register}
                    handleSubmit={handleSubmit}
                    errors={errors}
                    isModal={false}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Modal View */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-6 md:inset-16 lg:inset-24 z-50 bg-slate-900/95 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden flex flex-col max-w-4xl mx-auto"
            >
              <TerminalHeader isModal />
              <ChatContent
                user={user}
                messages={messages}
                inputValue={inputValue}
                setInputValue={setInputValue}
                isTyping={isTyping}
                isSending={isSending}
                isJoining={isJoining}
                onSend={handleSend}
                onLeave={handleLeave}
                onJoin={onJoin}
                conversationId={conversationId}
                startTyping={startTyping}
                stopTyping={stopTyping}
                messagesEndRef={messagesEndRef}
                register={register}
                handleSubmit={handleSubmit}
                errors={errors}
                isModal
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
