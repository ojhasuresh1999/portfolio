import { User, IUser, Role } from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword, verifyPassword, needsRehash } from "./argon2.service";
import type { ServiceResult } from "../types";
import type { HydratedDocument } from "mongoose";

// =============================================================================
// User Service
// Handles user CRUD operations with secure password hashing
// =============================================================================

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
  role?: Role;
}

export interface UserSafeData {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: Role;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

/**
 * Convert user document to safe data (without password)
 */
function toSafeUser(user: IUser): UserSafeData {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

class UserService {
  private async ensureConnection(): Promise<void> {
    await connectToDatabase();
  }

  /**
   * Find user by email
   */
  async findByEmail(
    email: string,
  ): Promise<ServiceResult<HydratedDocument<IUser> | null>> {
    try {
      await this.ensureConnection();
      const user = await User.findOne({ email: email.toLowerCase() });
      return { success: true, data: user };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to find user";
      return { success: false, error: message };
    }
  }

  /**
   * Find user by ID
   */
  async findById(
    id: string,
  ): Promise<ServiceResult<HydratedDocument<IUser> | null>> {
    try {
      await this.ensureConnection();
      const user = await User.findById(id);
      return { success: true, data: user };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to find user";
      return { success: false, error: message };
    }
  }

  /**
   * Get user safe data (without password)
   */
  async getSafeUserById(
    id: string,
  ): Promise<ServiceResult<UserSafeData | null>> {
    const result = await this.findById(id);
    if (!result.success) return result;
    if (!result.data) return { success: true, data: null };
    return { success: true, data: toSafeUser(result.data) };
  }

  /**
   * Create a new user with hashed password
   */
  async createUser(
    input: CreateUserInput,
  ): Promise<ServiceResult<UserSafeData>> {
    try {
      await this.ensureConnection();

      // Check if user already exists
      const existing = await User.findOne({ email: input.email.toLowerCase() });
      if (existing) {
        return { success: false, error: "User with this email already exists" };
      }

      // Hash password with Argon2
      const hashedPassword = await hashPassword(input.password);

      // Create user
      const user = new User({
        email: input.email.toLowerCase(),
        password: hashedPassword,
        name: input.name,
        role: input.role || Role.ADMIN,
        twoFactorEnabled: false,
        loginAttempts: 0,
      });

      await user.save();
      return { success: true, data: toSafeUser(user) };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create user";
      return { success: false, error: message };
    }
  }

  /**
   * Validate password and handle login attempts
   */
  async validatePassword(
    user: HydratedDocument<IUser>,
    password: string,
  ): Promise<ServiceResult<boolean>> {
    try {
      // Check if account is locked
      if (user.isLocked()) {
        const lockMinutes = Math.ceil(
          ((user.lockUntil?.getTime() || 0) - Date.now()) / 60000,
        );
        return {
          success: false,
          error: `Account locked. Try again in ${lockMinutes} minutes.`,
        };
      }

      // Verify password
      const isValid = await verifyPassword(user.password, password);

      if (!isValid) {
        // Increment failed attempts
        await user.incrementLoginAttempts();
        return { success: true, data: false };
      }

      // Check if password needs rehashing
      if (await needsRehash(user.password)) {
        const newHash = await hashPassword(password);
        await user.updateOne({ password: newHash });
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      return { success: true, data: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Validation failed";
      return { success: false, error: message };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(
    userId: string,
    newPassword: string,
  ): Promise<ServiceResult<boolean>> {
    try {
      await this.ensureConnection();

      const hashedPassword = await hashPassword(newPassword);
      const result = await User.findByIdAndUpdate(userId, {
        password: hashedPassword,
        $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
      });

      if (!result) {
        return { success: false, error: "User not found" };
      }

      return { success: true, data: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update password";
      return { success: false, error: message };
    }
  }

  /**
   * Set password reset token
   */
  async setPasswordResetToken(
    email: string,
    token: string,
    expires: Date,
  ): Promise<ServiceResult<boolean>> {
    try {
      await this.ensureConnection();

      const result = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { passwordResetToken: token, passwordResetExpires: expires },
      );

      if (!result) {
        return { success: false, error: "User not found" };
      }

      return { success: true, data: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to set reset token";
      return { success: false, error: message };
    }
  }

  /**
   * Clear password reset token
   */
  async clearPasswordResetToken(
    userId: string,
  ): Promise<ServiceResult<boolean>> {
    try {
      await this.ensureConnection();

      await User.findByIdAndUpdate(userId, {
        $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
      });

      return { success: true, data: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to clear reset token";
      return { success: false, error: message };
    }
  }
}

export const userService = new UserService();
