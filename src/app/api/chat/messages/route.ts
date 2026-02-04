import { NextRequest, NextResponse } from "next/server";
import { MessageService } from "@/server/services/message.service";

// =============================================================================
// Messages API Route
// =============================================================================

/**
 * GET /api/chat/messages?conversationId=xxx&page=1&limit=50 - Get messages
 */
/**
 * GET /api/chat/messages?conversationId=xxx&page=1&limit=50 - Get messages
 */
import { requireAuth } from "@/server/utils/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const session = searchParams.get("session");

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID required" },
        { status: 400 },
      );
    }

    // Check auth
    // 1. Admin via Bearer token
    const authPayload = requireAuth(request);
    const isAdmin = !(authPayload instanceof NextResponse);

    // 2. User via session token (query param or header)
    const sessionHeader = request.headers.get("X-Session-Token");
    const isUser = !!session || !!sessionHeader;

    if (!isAdmin && !isUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await MessageService.findByConversation(conversationId, {
      page,
      limit,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messages: result.data.messages,
      total: result.data.total,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/chat/messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
