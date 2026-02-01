import mongoose, { Schema, Model, Types } from "mongoose";

// ============================================
// SocialLink Model
// ============================================

export interface ISocialLink {
  _id: Types.ObjectId;
  platform: string;
  url: string;
  icon: string;
  order: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SocialLinkSchema = new Schema<ISocialLink>(
  {
    platform: { type: String, required: true },
    url: { type: String, required: true },
    icon: { type: String, required: true },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

SocialLinkSchema.index({ order: 1 });
SocialLinkSchema.index({ isVisible: 1 });

export const SocialLink: Model<ISocialLink> =
  mongoose.models.SocialLink ||
  mongoose.model<ISocialLink>("SocialLink", SocialLinkSchema);
