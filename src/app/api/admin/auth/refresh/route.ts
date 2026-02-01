import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/server/services/auth.service";
import { z } from "zod";

// =============================================================================
// POST /api/admin/auth/refresh
// Refresh access token using refresh token
// =============================================================================

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = refreshSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const { refreshToken } = validation.data;

    // Refresh the tokens
    const result = await authService.refreshToken(refreshToken);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      accessToken: result.data.accessToken,
      refreshToken: result.data.refreshToken,
      expiresIn: result.data.expiresIn,
    });
  } catch (error) {
    console.error("[Auth Refresh Error]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
