import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/server/services/auth.service";
import { verifyTwoFactorToken } from "@/server/utils/jwt.util";
import { z } from "zod";

// =============================================================================
// POST /api/admin/auth/verify-2fa
// Verify 2FA code and complete login
// =============================================================================

const verify2faSchema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must be numeric"),
  requestId: z.string().min(1, "Request ID is required"),
  twoFactorToken: z.string().min(1, "2FA token is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = verify2faSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const { code, requestId, twoFactorToken } = validation.data;

    // Verify the 2FA token
    const tokenPayload = verifyTwoFactorToken(twoFactorToken);
    if (!tokenPayload) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification session" },
        { status: 401 },
      );
    }

    // Verify the requestId matches
    if (tokenPayload.requestId !== requestId) {
      return NextResponse.json(
        { success: false, error: "Invalid request ID" },
        { status: 400 },
      );
    }

    // Verify the 2FA code
    const result = await authService.verifyTwoFactor(
      requestId,
      code,
      tokenPayload.userId,
      tokenPayload.email,
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 },
      );
    }

    const { user, tokens } = result.data;

    return NextResponse.json({
      success: true,
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    });
  } catch (error) {
    console.error("[Auth Verify 2FA Error]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
