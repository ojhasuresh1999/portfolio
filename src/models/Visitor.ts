import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Visitor Model — ONE document per unique device/browser.
 * Identified by a client-side fingerprint hash (SHA-256 of canvas, WebGL,
 * screen, timezone, UA, etc.). No cookies needed.
 *
 * This keeps DB growth proportional to unique visitors, not page views.
 */
export interface IVisitor extends Document {
  fingerprintHash: string;
  firstSeen: Date;
  lastSeen: Date;
  totalVisits: number;
  pages: string[];
  browser: string;
  os: string;
  device: string;
  screenResolution: string;
  language: string;
  timezone: string;
  country: string;
  city: string;
  referrer: string;
  lastIp: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IVisitorModel = Model<IVisitor>;

const visitorSchema = new Schema<IVisitor>(
  {
    fingerprintHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    totalVisits: { type: Number, default: 1 },
    pages: { type: [String], default: [] },
    browser: { type: String, default: "Unknown" },
    os: { type: String, default: "Unknown" },
    device: { type: String, default: "Desktop" },
    screenResolution: { type: String, default: "" },
    language: { type: String, default: "" },
    timezone: { type: String, default: "" },
    country: { type: String, default: "Unknown" },
    city: { type: String, default: "Unknown" },
    referrer: { type: String, default: "" },
    lastIp: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for analytics queries
visitorSchema.index({ lastSeen: -1 });
visitorSchema.index({ firstSeen: 1 });
visitorSchema.index({ device: 1 });
visitorSchema.index({ country: 1 });

export const Visitor: IVisitorModel =
  mongoose.models.Visitor || mongoose.model<IVisitor>("Visitor", visitorSchema);
