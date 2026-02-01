import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/server/services/auth.service";
import { requireAuth } from "@/server/utils/auth-middleware";
import { verifyResetToken } from "@/server/utils/jwt.util";
import { z } from "zod";

// =============================================================================
// POST /api/admin/auth/reset-password
// Reset password (with token or while authenticated)
// =============================================================================

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string(),
    resetToken: z.string().optional(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const { newPassword, resetToken } = validation.data;

    let userId: string;

    if (resetToken) {
      // Reset with token (forgot password flow)
      const tokenPayload = verifyResetToken(resetToken);
      if (!tokenPayload) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired reset token" },
          { status: 401 },
        );
      }
      userId = tokenPayload.userId;
    } else {
      // Reset while authenticated (current user)
      const authResult = requireAuth(request);
      if (authResult instanceof NextResponse) {
        return authResult;
      }
      userId = authResult.userId;
    }

    // Reset the password
    const result = await authService.resetPassword(userId, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("[Auth Reset Password Error]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
