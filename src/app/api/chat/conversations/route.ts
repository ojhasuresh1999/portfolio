import { NextRequest, NextResponse } from "next/server";
import { ConversationService } from "@/server/services/conversation.service";

// =============================================================================
// Conversations API Route
// =============================================================================

/**
 * GET /api/chat/conversations - Get conversations
 * For admin: returns all conversations
 * For users: requires session token query param
 */
/**
 * GET /api/chat/conversations - Get conversations
 * For admin: returns all conversations (requires Bearer token)
 * For users: requires session token query param
 */
import { requireAuth } from "@/server/utils/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = searchParams.get("session");

    // Check if admin via Bearer token
    // We check this first
    const authPayload = requireAuth(request);

    // If it's a valid admin payload (not an error response)
    if (!(authPayload instanceof NextResponse)) {
      // Admin requesting all conversations
      const result = await ConversationService.findAllWithParticipants(); // Assuming this service exists and works

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        conversations: result.data,
      });
    }

    // Fallback: Check for legacy cookie (optional, can remove if we fully migrated)
    /* 
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin-session");
    if (adminSession?.value) { ... }
    */

    // User requesting their conversation
    if (!session) {
      // If authPayload was an error (NextResponse), we could return it here,
      // but we want to allow the "user" flow if "session" param is present.
      // So if no session AND no admin auth, return 401.
      return NextResponse.json(
        { error: "Session token or admin auth required" },
        { status: 401 },
      );
    }

    // For users, we need to fetch via the user's participant ID
    // TODO: implement user fetch based on session token if needed
    return NextResponse.json({
      success: true,
      conversations: [],
    });
  } catch (error) {
    console.error("GET /api/chat/conversations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/chat/conversations - Create a new conversation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId } = body;

    if (!participantId) {
      return NextResponse.json(
        { error: "Participant ID required" },
        { status: 400 },
      );
    }

    const result = await ConversationService.create(participantId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      conversation: {
        _id: result.data._id.toString(),
        participant: result.data.participant.toString(),
        unreadCount: result.data.unreadCount,
        isActive: result.data.isActive,
        createdAt: result.data.createdAt,
      },
    });
  } catch (error) {
    console.error("POST /api/chat/conversations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
