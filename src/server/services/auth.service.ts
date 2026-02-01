import { userService, UserSafeData } from "./user.service";
import {
  generateTokenPair,
  generateTwoFactorToken,
  verifyRefreshToken,
  TokenPair,
} from "../utils/jwt.util";
import { randomBytes } from "crypto";
import type { ServiceResult } from "../types";
import type { HydratedDocument } from "mongoose";
import type { IUser, IUserMethods } from "@/models/User";

// =============================================================================
// Auth Service
// Handles authentication flows including login, 2FA, and token management
// =============================================================================

export interface LoginResult {
  user: UserSafeData;
  tokens: TokenPair;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string;
  requestId?: string;
}

export interface SessionInfo {
  user: UserSafeData;
  sessionId: string;
  expiresAt: Date;
}

// In-memory store for 2FA codes (use Redis in production)
const twoFactorCodes = new Map<string, { code: string; expires: number }>();

class AuthService {
  /**
   * Generate a random session ID
   */
  private generateSessionId(): string {
    return randomBytes(32).toString("hex");
  }

  /**
   * Generate a 6-digit OTP code
   */
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Login with email and password
   */
  async login(
    email: string,
    password: string,
    _stayLinked: boolean = false,
  ): Promise<ServiceResult<LoginResult>> {
    try {
      // Find user
      const userResult = await userService.findByEmail(email);
      if (!userResult.success) {
        return { success: false, error: userResult.error };
      }

      const user = userResult.data;
      if (!user) {
        return { success: false, error: "Invalid credentials" };
      }

      // Validate password
      const validResult = await userService.validatePassword(user, password);
      if (!validResult.success) {
        return { success: false, error: validResult.error };
      }

      if (!validResult.data) {
        return { success: false, error: "Invalid credentials" };
      }

      const sessionId = this.generateSessionId();

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        return this.initiateTwoFactor(user, sessionId);
      }

      // Generate tokens
      const tokens = generateTokenPair(
        user._id.toString(),
        user.email,
        user.role,
        sessionId,
      );

      // Extend refresh token if stayLinked
      // (In production, you'd generate a longer-lived token here)

      const safeUser: UserSafeData = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      };

      return {
        success: true,
        data: {
          user: safeUser,
          tokens,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      return { success: false, error: message };
    }
  }

  /**
   * Initiate 2FA verification
   */
  private async initiateTwoFactor(
    user: HydratedDocument<IUser, IUserMethods>,
    _sessionId: string,
  ): Promise<ServiceResult<LoginResult>> {
    const requestId = `AUTH_${randomBytes(4).toString("hex").toUpperCase()}_X`;
    const otpCode = this.generateOtpCode();

    // Store OTP code (5 minute expiry)
    twoFactorCodes.set(requestId, {
      code: otpCode,
      expires: Date.now() + 5 * 60 * 1000,
    });

    // Generate 2FA token for verification step
    const twoFactorToken = generateTwoFactorToken(
      user._id.toString(),
      user.email,
      requestId,
    );

    // In production, send OTP via email/SMS here
    console.log(`[2FA] Code for ${user.email}: ${otpCode}`);

    const safeUser: UserSafeData = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };

    return {
      success: true,
      data: {
        user: safeUser,
        tokens: { accessToken: "", refreshToken: "", expiresIn: 0 },
        requiresTwoFactor: true,
        twoFactorToken,
        requestId,
      },
    };
  }

  /**
   * Verify 2FA code
   */
  async verifyTwoFactor(
    requestId: string,
    code: string,
    userId: string,
    email: string,
  ): Promise<ServiceResult<LoginResult>> {
    try {
      // Get stored code
      const storedData = twoFactorCodes.get(requestId);
      if (!storedData) {
        return {
          success: false,
          error: "Invalid or expired verification request",
        };
      }

      // Check expiry
      if (Date.now() > storedData.expires) {
        twoFactorCodes.delete(requestId);
        return { success: false, error: "Verification code expired" };
      }

      // Verify code
      if (storedData.code !== code) {
        return { success: false, error: "Invalid verification code" };
      }

      // Clean up
      twoFactorCodes.delete(requestId);

      // Get user
      const userResult = await userService.getSafeUserById(userId);
      if (!userResult.success || !userResult.data) {
        return { success: false, error: "User not found" };
      }

      // Generate tokens
      const sessionId = this.generateSessionId();
      const tokens = generateTokenPair(
        userId,
        email,
        userResult.data.role,
        sessionId,
      );

      return {
        success: true,
        data: {
          user: userResult.data,
          tokens,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Verification failed";
      return { success: false, error: message };
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<ServiceResult<TokenPair>> {
    try {
      const payload = verifyRefreshToken(refreshToken);
      if (!payload) {
        return { success: false, error: "Invalid refresh token" };
      }

      // Verify user still exists and is active
      const userResult = await userService.getSafeUserById(payload.userId);
      if (!userResult.success || !userResult.data) {
        return { success: false, error: "User not found" };
      }

      // Generate new token pair
      const tokens = generateTokenPair(
        payload.userId,
        payload.email,
        payload.role,
        payload.sessionId,
      );

      return { success: true, data: tokens };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Token refresh failed";
      return { success: false, error: message };
    }
  }

  /**
   * Get session info from token payload
   */
  async getSession(
    userId: string,
    sessionId: string,
    expiresAt: Date,
  ): Promise<ServiceResult<SessionInfo>> {
    try {
      const userResult = await userService.getSafeUserById(userId);
      if (!userResult.success || !userResult.data) {
        return { success: false, error: "User not found" };
      }

      return {
        success: true,
        data: {
          user: userResult.data,
          sessionId,
          expiresAt,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Session fetch failed";
      return { success: false, error: message };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(
    userId: string,
    newPassword: string,
  ): Promise<ServiceResult<boolean>> {
    return userService.updatePassword(userId, newPassword);
  }

  /**
   * Enable 2FA for user
   */
  async enableTwoFactor(userId: string): Promise<ServiceResult<boolean>> {
    try {
      const userResult = await userService.findById(userId);
      if (!userResult.success || !userResult.data) {
        return { success: false, error: "User not found" };
      }

      await userResult.data.updateOne({ twoFactorEnabled: true });
      return { success: true, data: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to enable 2FA";
      return { success: false, error: message };
    }
  }

  /**
   * Disable 2FA for user
   */
  async disableTwoFactor(userId: string): Promise<ServiceResult<boolean>> {
    try {
      const userResult = await userService.findById(userId);
      if (!userResult.success || !userResult.data) {
        return { success: false, error: "User not found" };
      }

      await userResult.data.updateOne({
        twoFactorEnabled: false,
        $unset: { twoFactorSecret: 1 },
      });
      return { success: true, data: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to disable 2FA";
      return { success: false, error: message };
    }
  }

  /**
   * Resend 2FA code
   */
  resendTwoFactorCode(requestId: string): ServiceResult<{ expiresIn: number }> {
    const storedData = twoFactorCodes.get(requestId);
    if (!storedData || Date.now() > storedData.expires) {
      return { success: false, error: "Invalid or expired request" };
    }

    // Generate new code
    const newCode = this.generateOtpCode();
    const newExpires = Date.now() + 5 * 60 * 1000;

    twoFactorCodes.set(requestId, { code: newCode, expires: newExpires });

    // In production, send via email/SMS
    console.log(`[2FA] Resent code: ${newCode}`);

    return {
      success: true,
      data: { expiresIn: 300 }, // 5 minutes
    };
  }
}

export const authService = new AuthService();
