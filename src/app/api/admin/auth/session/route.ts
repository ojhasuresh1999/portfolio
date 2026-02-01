import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/server/services/auth.service";
import { requireAuth } from "@/server/utils/auth-middleware";

// =============================================================================
// GET /api/admin/auth/session
// Get current session info
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId, sessionId, exp } = authResult;
    const expiresAt = exp ? new Date(exp * 1000) : new Date();

    // Get session info
    const result = await authService.getSession(userId, sessionId, expiresAt);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      ...result.data,
    });
  } catch (error) {
    console.error("[Auth Session Error]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
