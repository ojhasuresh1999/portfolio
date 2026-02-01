import mongoose, { Schema, Model, Types } from "mongoose";

// ============================================
// HeroContent Model
// ============================================

export interface IHeroContent {
  _id: Types.ObjectId;
  title: string;
  highlightWord: string;
  terminalCommand: string;
  description: string;
  ctaPrimaryText: string;
  ctaPrimaryLink: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HeroContentSchema = new Schema<IHeroContent>(
  {
    title: { type: String, required: true },
    highlightWord: { type: String, required: true },
    terminalCommand: { type: String, required: true },
    description: { type: String, required: true },
    ctaPrimaryText: { type: String, default: "Initialize Project" },
    ctaPrimaryLink: { type: String, default: "#contact" },
    ctaSecondaryText: { type: String, default: "View Source" },
    ctaSecondaryLink: { type: String, default: "#" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

HeroContentSchema.index({ isActive: 1 });

export const HeroContent: Model<IHeroContent> =
  mongoose.models.HeroContent ||
  mongoose.model<IHeroContent>("HeroContent", HeroContentSchema);
