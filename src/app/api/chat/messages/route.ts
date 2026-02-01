import { NextRequest, NextResponse } from "next/server";
import { MessageService } from "@/server/services/message.service";

// =============================================================================
// Messages API Route
// =============================================================================

/**
 * GET /api/chat/messages?conversationId=xxx&page=1&limit=50 - Get messages
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID required" },
        { status: 400 },
      );
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
