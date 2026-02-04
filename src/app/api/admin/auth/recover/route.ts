import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/server/services/auth.service";
import { z } from "zod";

// =============================================================================
// /api/admin/auth/recover
// POST: Recover password using 2FA
// =============================================================================

const recoverSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

/**
 * @swagger
 * /api/admin/auth/recover:
 *   post:
 *     summary: Verify 2FA for Recovery
 *     description: Verify TOTP code to receive a password reset token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = recoverSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email, code } = validation.data;

    const result = await authService.verifyTwoFactorRecovery(email, code);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      resetToken: result.data.resetToken,
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
