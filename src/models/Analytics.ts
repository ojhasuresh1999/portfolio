import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnalytics extends Document {
  path: string;
  referrer: string;
  userAgent: string;
  ip: string;
  browser: string;
  os: string;
  device: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IAnalyticsModel = Model<IAnalytics>;

const analyticsSchema = new Schema<IAnalytics>(
  {
    path: { type: String, required: true, index: true },
    referrer: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    ip: { type: String, default: "" },
    browser: { type: String, default: "Unknown" },
    os: { type: String, default: "Unknown" },
    device: { type: String, default: "Unknown" },
  },
  {
    timestamps: true,
  },
);

// Indexes for faster queries in dashboard
analyticsSchema.index({ createdAt: 1 });
analyticsSchema.index({ path: 1, createdAt: 1 });

export const Analytics: IAnalyticsModel =
  mongoose.models.Analytics ||
  mongoose.model<IAnalytics>("Analytics", analyticsSchema);
