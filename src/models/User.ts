import mongoose, { Schema, Model, Types } from "mongoose";

// ============================================
// User Model
// ============================================

export enum Role {
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name?: string;
  image?: string;
  role: Role;
  // 2FA fields
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  // Password reset
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  // Security tracking
  lastLoginAt?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Virtual for checking if account is locked
export interface IUserMethods {
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

type UserModel = Model<IUser, object, IUserMethods>;

const UserSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String },
    image: { type: String },
    role: { type: String, enum: Object.values(Role), default: Role.ADMIN },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    lastLoginAt: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  { timestamps: true },
);

// Lock duration: 15 minutes
const LOCK_TIME = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

// Check if account is locked
UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Increment login attempts and lock if necessary
UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // If we have a previous lock that has expired, reset
  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
    return;
  }

  const updates: Record<string, unknown> = { $inc: { loginAttempts: 1 } };

  // Lock account if max attempts reached
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_TIME) };
  }

  await this.updateOne(updates);
};

// Reset login attempts after successful login
UserSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  await this.updateOne({
    $set: { loginAttempts: 0, lastLoginAt: new Date() },
    $unset: { lockUntil: 1 },
  });
};

// Note: unique: true on email already creates an index

export const User: UserModel =
  mongoose.models.User || mongoose.model<IUser, UserModel>("User", UserSchema);
