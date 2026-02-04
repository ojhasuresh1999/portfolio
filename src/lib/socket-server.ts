import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { connectToDatabase } from "./mongodb";
import { ChatUser } from "@/models/ChatUser";
import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  MessageData,
  ChatUserData,
} from "@/types/socket.types";

// =============================================================================
// Socket.IO Server Configuration
// =============================================================================

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

let io: TypedServer | null = null;

// Admin room name for broadcasting
const ADMIN_ROOM = "admin-room";

// =============================================================================
// Initialize Socket.IO Server
// =============================================================================

export function initSocketServer(httpServer: HttpServer): TypedServer {
  if (io) return io;

  io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Connect to database on server start
  connectToDatabase().catch(console.error);

  io.on("connection", handleConnection);

  console.log("✅ Socket.IO server initialized");
  return io;
}

// =============================================================================
// Get Socket.IO instance (for use in API routes)
// =============================================================================

export function getIO(): TypedServer | null {
  return io;
}

// =============================================================================
// Connection Handler
// =============================================================================

async function handleConnection(socket: TypedSocket) {
  console.log(`🔌 New socket connection: ${socket.id}`);

  // Initialize socket data
  socket.data.userType = "user";

  // -------------------------------------------------------------------------
  // User Join Event (Guest users)
  // -------------------------------------------------------------------------
  socket.on("user:join", async (data, callback) => {
    try {
      await connectToDatabase();

      const user = await ChatUser.findOne({ sessionToken: data.sessionToken });

      if (!user) {
        callback({ success: false, error: "Invalid session token" });
        return;
      }

      // Update user status
      user.isOnline = true;
      user.socketId = socket.id;
      user.lastSeen = new Date();
      await user.save();

      // Store user info in socket data
      socket.data.userId = user._id.toString();
      socket.data.userType = "user";
      socket.data.sessionToken = data.sessionToken;

      // Join user's personal room for targeted messages
      socket.join(`user:${user._id.toString()}`);

      // Notify admins that user is online
      socket.to(ADMIN_ROOM).emit("user:online", {
        userId: user._id.toString(),
      });

      const userData: ChatUserData = {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        photo: user.photo,
        isOnline: true,
        lastSeen: user.lastSeen,
      };

      callback({ success: true, user: userData });
    } catch (error) {
      console.error("user:join error:", error);
      callback({ success: false, error: "Failed to join" });
    }
  });

  // -------------------------------------------------------------------------
  // Admin Join Event
  // -------------------------------------------------------------------------
  socket.on("admin:join", async (data, callback) => {
    try {
      socket.data.userType = "admin";
      socket.data.userId = "admin";

      // Join admin room
      socket.join(ADMIN_ROOM);

      console.log(`👑 Admin joined: ${socket.id}`);
      callback({ success: true });
    } catch (error) {
      console.error("admin:join error:", error);
      callback({ success: false, error: "Failed to join as admin" });
    }
  });

  // -------------------------------------------------------------------------
  // Join Conversation Room
  // -------------------------------------------------------------------------
  socket.on("conversation:join", async (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    socket.data.currentConversation = conversationId;

    // Mark messages as read when joining
    if (socket.data.userType === "user" && socket.data.userId) {
      await markMessagesAsRead(conversationId, socket.data.userId, "user");
    }
  });

  // -------------------------------------------------------------------------
  // Leave Conversation Room
  // -------------------------------------------------------------------------
  socket.on("conversation:leave", (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
    socket.data.currentConversation = undefined;
  });

  // -------------------------------------------------------------------------
  // Typing Events
  // -------------------------------------------------------------------------
  socket.on("typing:start", async (conversationId) => {
    if (!socket.data.userId) return;

    const typingData = {
      conversationId,
      userId: socket.data.userId,
      userName: "", // Will be filled below
    };

    if (socket.data.userType === "user") {
      const user = await ChatUser.findById(socket.data.userId).lean();
      typingData.userName = user?.name || "User";
    } else {
      typingData.userName = "Admin";
    }

    socket.to(`conversation:${conversationId}`).emit("user:typing", typingData);
  });

  socket.on("typing:stop", (conversationId) => {
    if (!socket.data.userId) return;

    socket.to(`conversation:${conversationId}`).emit("user:stop-typing", {
      conversationId,
      userId: socket.data.userId,
      userName: "",
    });
  });

  // -------------------------------------------------------------------------
  // Send Message Event
  // -------------------------------------------------------------------------
  socket.on("message:send", async (data, callback) => {
    try {
      await connectToDatabase();

      if (!socket.data.userId) {
        callback({ success: false, error: "Not authenticated" });
        return;
      }

      // Create message
      const message = await Message.create({
        conversationId: data.conversationId,
        senderId: socket.data.userId,
        senderType: socket.data.userType,
        content: data.content,
        media: data.media,
        reactions: [],
      });

      // Update conversation last message
      await Conversation.findByIdAndUpdate(data.conversationId, {
        lastMessage: {
          content: data.content.substring(0, 100),
          timestamp: message.createdAt,
          senderType: socket.data.userType,
        },
        $inc: {
          [`unreadCount.${socket.data.userType === "admin" ? "user" : "admin"}`]: 1,
        },
      });

      const messageData: MessageData = {
        _id: message._id.toString(),
        conversationId: data.conversationId,
        senderId: socket.data.userId,
        senderType: socket.data.userType,
        content: message.content,
        media: message.media,
        reactions: [],
        createdAt: message.createdAt,
      };

      // Broadcast to conversation room (including sender for confirmation)
      io?.to(`conversation:${data.conversationId}`).emit(
        "message:new",
        messageData,
      );

      // Also notify admins if message is from user
      if (socket.data.userType === "user") {
        socket.to(ADMIN_ROOM).emit("message:new", messageData);
      }

      callback({ success: true, message: messageData });
    } catch (error) {
      console.error("message:send error:", error);
      callback({ success: false, error: "Failed to send message" });
    }
  });

  // -------------------------------------------------------------------------
  // Mark Messages as Read
  // -------------------------------------------------------------------------
  socket.on("message:read", async (conversationId) => {
    if (!socket.data.userId) return;

    await markMessagesAsRead(
      conversationId,
      socket.data.userId,
      socket.data.userType,
    );

    // Notify the other party
    io?.to(`conversation:${conversationId}`).emit("message:read", {
      conversationId,
      readBy: socket.data.userId,
      readByType: socket.data.userType,
    });
  });

  // -------------------------------------------------------------------------
  // Message Reaction Event
  // -------------------------------------------------------------------------
  socket.on("message:react", async (data, callback) => {
    try {
      await connectToDatabase();

      if (!socket.data.userId) {
        callback({ success: false, error: "Not authenticated" });
        return;
      }

      const message = await Message.findById(data.messageId);

      if (!message) {
        callback({ success: false, error: "Message not found" });
        return;
      }

      // Find or create reaction for this emoji
      const existingReaction = message.reactions.find(
        (r) => r.emoji === data.emoji,
      );

      if (existingReaction) {
        const userIndex = existingReaction.userIds.indexOf(socket.data.userId);
        if (userIndex > -1) {
          // Remove user from reaction
          existingReaction.userIds.splice(userIndex, 1);
          // Remove reaction if no users left
          if (existingReaction.userIds.length === 0) {
            message.reactions = message.reactions.filter(
              (r) => r.emoji !== data.emoji,
            );
          }
        } else {
          // Add user to reaction
          existingReaction.userIds.push(socket.data.userId);
        }
      } else {
        // Create new reaction
        message.reactions.push({
          emoji: data.emoji,
          userIds: [socket.data.userId],
        });
      }

      await message.save();

      const reactions = message.reactions.map((r) => ({
        emoji: r.emoji,
        usersIds: r.userIds,
      }));

      // Broadcast reaction update
      io?.to(`conversation:${message.conversationId.toString()}`).emit(
        "message:reaction",
        {
          messageId: data.messageId,
          reactions,
        },
      );

      callback({ success: true, reactions });
    } catch (error) {
      console.error("message:react error:", error);
      callback({ success: false, error: "Failed to add reaction" });
    }
  });

  // -------------------------------------------------------------------------
  // Disconnect Handler
  // -------------------------------------------------------------------------
  socket.on("disconnect", async () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);

    if (socket.data.userType === "user" && socket.data.userId) {
      try {
        await connectToDatabase();

        const lastSeen = new Date();
        await ChatUser.findByIdAndUpdate(socket.data.userId, {
          isOnline: false,
          lastSeen,
          socketId: null,
        });

        // Notify admins that user went offline
        socket.to(ADMIN_ROOM).emit("user:offline", {
          userId: socket.data.userId,
          lastSeen,
        });
      } catch (error) {
        console.error("disconnect handler error:", error);
      }
    }
  });
}

// =============================================================================
// Helper Functions
// =============================================================================

async function markMessagesAsRead(
  conversationId: string,
  userId: string,
  userType: "admin" | "user",
) {
  try {
    await connectToDatabase();

    // Mark unread messages as read
    await Message.updateMany(
      {
        conversationId,
        senderType: userType === "admin" ? "user" : "admin",
        readAt: null,
      },
      { readAt: new Date() },
    );

    // Reset unread count for this user type
    await Conversation.findByIdAndUpdate(conversationId, {
      [`unreadCount.${userType}`]: 0,
    });
  } catch (error) {
    console.error("markMessagesAsRead error:", error);
  }
}

// =============================================================================
// Utility: Emit to specific user
// =============================================================================

export function emitToUser(
  userId: string,
  event: keyof ServerToClientEvents,
  data: unknown,
) {
  io?.to(`user:${userId}`).emit(event, data as never);
}

// =============================================================================
// Utility: Emit to admins
// =============================================================================

export function emitToAdmins(event: keyof ServerToClientEvents, data: unknown) {
  io?.to(ADMIN_ROOM).emit(event, data as never);
}

// =============================================================================
// Utility: Emit to conversation
// =============================================================================

export function emitToConversation(
  conversationId: string,
  event: keyof ServerToClientEvents,
  data: unknown,
) {
  io?.to(`conversation:${conversationId}`).emit(event, data as never);
}
