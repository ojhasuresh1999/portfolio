import { NextRequest, NextResponse } from "next/server";
import { ChatUserService } from "@/server/services/chat-user.service";
import { z } from "zod";

// =============================================================================
// Chat Users API Route
// =============================================================================

// Validation schema for user registration
const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  photo: z.string().optional(),
});

/**
 * POST /api/chat/users - Register a new guest user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const result = await ChatUserService.register(validation.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: result.data._id.toString(),
        name: result.data.name,
        email: result.data.email,
        photo: result.data.photo,
        sessionToken: result.data.sessionToken,
        conversationId: result.data.conversationId,
      },
    });
  } catch (error) {
    console.error("POST /api/chat/users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/chat/users?session=xxx - Get user by session token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionToken = searchParams.get("session");

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Session token required" },
        { status: 400 },
      );
    }

    const result = await ChatUserService.findBySession(sessionToken);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    if (!result.data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: result.data._id.toString(),
        name: result.data.name,
        email: result.data.email,
        photo: result.data.photo,
        sessionToken: result.data.sessionToken,
        conversationId: result.data.conversationId,
        isOnline: result.data.isOnline,
        lastSeen: result.data.lastSeen,
      },
    });
  } catch (error) {
    console.error("GET /api/chat/users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
