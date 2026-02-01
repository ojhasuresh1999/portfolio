import { NextResponse } from "next/server";

// =============================================================================
// POST /api/admin/auth/logout
// Logout endpoint - clears session on client side
// =============================================================================

export async function POST() {
  try {
    // In a stateless JWT implementation, logout is handled client-side
    // by clearing the tokens from storage.

    // For stateful sessions (with Redis/DB), you would:
    // 1. Get the session ID from the token
    // 2. Invalidate it in the session store

    // For now, we just acknowledge the logout request
    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("[Auth Logout Error]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
