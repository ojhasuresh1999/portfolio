import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/server/services/auth.service";
import { checkRateLimit, getClientIp } from "@/server/utils/auth-middleware";
import { z } from "zod";

// =============================================================================
// POST /api/admin/auth/login
// Admin login endpoint with rate limiting
// =============================================================================

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  stayLinked: z.boolean().optional().default(false),
});

/**
 * @swagger
 * /api/admin/auth/login:
 *   post:
 *     summary: Authenticate admin user
 *     description: Login with email and password to receive access and refresh tokens
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many attempts
 */

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 attempts per minute per IP
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, 5, 60);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many login attempts. Please try again later.",
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const { email, password, stayLinked } = validation.data;

    // Attempt login
    const result = await authService.login(email, password, stayLinked);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 },
      );
    }

    const { user, tokens, requiresTwoFactor, twoFactorToken, requestId } =
      result.data;

    // If 2FA is required, return partial response
    if (requiresTwoFactor) {
      return NextResponse.json({
        success: true,
        requiresTwoFactor: true,
        twoFactorToken,
        requestId,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    }

    // Return full response with tokens
    return NextResponse.json({
      success: true,
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    });
  } catch (error) {
    console.error("[Auth Login Error]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
