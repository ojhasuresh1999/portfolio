import mongoose, { Schema, Model, Types } from "mongoose";

// ============================================
// SiteSettings Model
// ============================================

export interface ISiteSettings {
  _id: Types.ObjectId;
  siteName: string;
  siteTagline: string;
  logoText: string;
  statusText: string;
  metaTitle?: string;
  metaDescription?: string;
  resumeUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    siteName: { type: String, default: "DEV_IO" },
    siteTagline: { type: String, default: "Backend Developer Portfolio" },
    logoText: { type: String, default: "DEV_IO" },
    statusText: { type: String, default: "System Online" },
    metaTitle: { type: String },
    metaDescription: { type: String },
    resumeUrl: { type: String },
  },
  { timestamps: true },
);

export const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
