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
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String },
    image: { type: String },
    role: { type: String, enum: Object.values(Role), default: Role.ADMIN },
  },
  { timestamps: true },
);

// Note: unique: true on email already creates an index

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
