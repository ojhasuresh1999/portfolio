import { userService, UserSafeData } from "./user.service";
import {
  generateTokenPair,
  generateTwoFactorToken,
  verifyRefreshToken,
  TokenPair,
} from "../utils/jwt.util";
import { randomBytes } from "crypto";
import type { ServiceResult } from "../types";
import { generateSecret, generateURI, verify } from "otplib";

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
        // Generate a temporary 2FA token to allow verification step
        const requestId = "TOTP_VERIFICATION";

        // Use dynamically imported generateTwoFactorToken to avoid circular dependency if needed,
        // or just use the imported one.
        // Note: verifyTwoFactor uses generateTokenPair which is imported.
        const twoFactorToken = generateTwoFactorToken(
          user._id.toString(),
          user.email,
          requestId,
        );

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
   * Generate a 2FA secret for setup
   */
  async generateTwoFactorSecret(
    email: string,
  ): Promise<ServiceResult<{ secret: string; otpauth: string }>> {
    try {
      const secret = generateSecret();
      const otpauth = generateURI({
        secret,
        label: email,
        issuer: "Portfolio Admin",
      });
      return { success: true, data: { secret, otpauth } };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate 2FA secret";
      return { success: false, error: message };
    }
  }

  /**
   * Verify 2FA token during setup
   */
  async verifyTwoFactorSetup(
    userId: string,
    token: string,
    secret: string,
  ): Promise<ServiceResult<boolean>> {
    try {
      const isValid = await verify({ token, secret });

      if (!isValid) {
        return { success: false, error: "Invalid verification code" };
      }

      // Save secret to user
      const userResult = await userService.findById(userId);
      if (!userResult.success || !userResult.data) {
        return { success: false, error: "User not found" };
      }

      await userResult.data.updateOne({
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      });

      return { success: true, data: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Verification failed";
      return { success: false, error: message };
    }
  }

  /**
   * Verify 2FA token for login
   */
  async verifyTwoFactor(
    userId: string,
    token: string,
    email: string,
  ): Promise<ServiceResult<LoginResult>> {
    try {
      // Get user to retrieve secret
      const userResult = await userService.findById(userId);
      if (!userResult.success || !userResult.data) {
        return { success: false, error: "User not found" };
      }

      const user = userResult.data;

      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        return { success: false, error: "2FA is not enabled for this user" };
      }

      const isValid = await verify({
        token,
        secret: user.twoFactorSecret,
      });

      if (!isValid) {
        return { success: false, error: "Invalid verification code" };
      }

      // Generate tokens
      const sessionId = this.generateSessionId();
      const tokens = generateTokenPair(userId, email, user.role, sessionId);

      // Return safe user data
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
      const message =
        error instanceof Error ? error.message : "Verification failed";
      return { success: false, error: message };
    }
  }

  /**
   * Verify 2FA for password recovery
   */
  async verifyTwoFactorRecovery(
    email: string,
    token: string,
  ): Promise<ServiceResult<{ resetToken: string }>> {
    try {
      // Find user by email
      const userResult = await userService.findByEmail(email);
      if (!userResult.success || !userResult.data) {
        return { success: false, error: "User not found" };
      }

      const user = userResult.data;

      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        return { success: false, error: "2FA is not enabled for this user" };
      }

      const isValid = await verify({
        token,
        secret: user.twoFactorSecret,
      });

      if (!isValid) {
        return { success: false, error: "Invalid verification code" };
      }

      // Generate a short-lived reset token (signed JWT)
      const { generateResetToken } = await import("../utils/jwt.util");
      const resetToken = generateResetToken(user._id.toString(), user.email);

      return {
        success: true,
        data: { resetToken },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Recovery verification failed";
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
}

export const authService = new AuthService();
