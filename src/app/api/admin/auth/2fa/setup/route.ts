import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/server/services/auth.service";
import { requireAuth } from "@/server/utils/auth-middleware";
import { z } from "zod";

// =============================================================================
// /api/admin/auth/2fa/setup
// POST: Generate 2FA secret
// PUT: Verify and enable 2FA
// =============================================================================

const verifySetupSchema = z.object({
  token: z.string().length(6),
  secret: z.string().min(10),
});

/**
 * @swagger
 * /api/admin/auth/2fa/setup:
 *   post:
 *     summary: Generate 2FA secret
 *     description: Generates a new TOTP secret for the authenticated user
 *     security:
 *       - bearerAuth: []
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const result = await authService.generateTwoFactorSecret(authResult.email);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      ...result.data,
    });
  } catch (error) {
    console.log("🚀 ~ POST ~ error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * @swagger
 * /api/admin/auth/2fa/setup:
 *   put:
 *     summary: Verify and Enable 2FA
 *     description: Verifies the TOTP code against the secret and enables 2FA
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const validation = verifySetupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 },
      );
    }

    const { token, secret } = validation.data;

    const result = await authService.verifyTwoFactorSetup(
      authResult.userId,
      token,
      secret,
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "2FA enabled successfully",
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
