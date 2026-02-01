import mongoose, { Schema, Model, Types } from "mongoose";

// ============================================
// AboutContent Model
// ============================================

export interface IAboutContent {
  _id: Types.ObjectId;
  title: string;
  subtitle: string;
  description: string;
  resumeUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AboutContentSchema = new Schema<IAboutContent>(
  {
    title: { type: String, default: "More Than Just Code" },
    subtitle: { type: String, default: "About Me" },
    description: { type: String, required: true },
    resumeUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

AboutContentSchema.index({ isActive: 1 });

export const AboutContent: Model<IAboutContent> =
  mongoose.models.AboutContent ||
  mongoose.model<IAboutContent>("AboutContent", AboutContentSchema);
