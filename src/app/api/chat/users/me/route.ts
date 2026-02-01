import { NextRequest, NextResponse } from "next/server";
import { ChatUserService } from "@/server/services/chat-user.service";

// =============================================================================
// GET /api/chat/users/me - Verify session and get current user
// =============================================================================

export async function GET(request: NextRequest) {
  const sessionToken = request.headers.get("X-Session-Token");

  if (!sessionToken) {
    return NextResponse.json(
      { success: false, error: "No session token provided" },
      { status: 401 },
    );
  }

  const result = await ChatUserService.findBySession(sessionToken);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 },
    );
  }

  if (!result.data) {
    return NextResponse.json(
      { success: false, error: "Invalid session" },
      { status: 401 },
    );
  }

  const user = result.data;

  return NextResponse.json({
    success: true,
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      photo: user.photo,
      conversationId: user.conversationId,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      sessionToken: user.sessionToken,
    },
  });
}
