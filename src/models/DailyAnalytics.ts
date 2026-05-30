import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * DailyAnalytics Model — ONE document per calendar day.
 * Pre-aggregated counters updated atomically via $inc and $addToSet.
 *
 * This means DB growth is O(days), not O(pageviews).
 * A year of data = ~365 documents total.
 */
export interface IDailyAnalytics extends Document {
  date: string; // "2026-05-30" — unique
  totalPageViews: number;
  uniqueVisitorHashes: string[]; // $addToSet keeps this deduplicated
  newVisitors: number;
  returningVisitors: number;
  bounces: number; // visitors who saw only 1 page
  pageViews: Map<string, number>; // { "/": 42, "/projects": 18 }
  devices: Map<string, number>; // { "Desktop": 30, "Mobile": 12 }
  browsers: Map<string, number>; // { "Chrome 120": 25, "Safari 17": 10 }
  operatingSystems: Map<string, number>; // { "Windows 11": 20, "macOS 14": 15 }
  countries: Map<string, number>; // { "IN": 30, "US": 12 }
  referrers: Map<string, number>; // { "google.com": 15, "direct": 20 }
  createdAt: Date;
  updatedAt: Date;
}

export type IDailyAnalyticsModel = Model<IDailyAnalytics>;

const dailyAnalyticsSchema = new Schema<IDailyAnalytics>(
  {
    date: { type: String, required: true, unique: true, index: true },
    totalPageViews: { type: Number, default: 0 },
    uniqueVisitorHashes: { type: [String], default: [] },
    newVisitors: { type: Number, default: 0 },
    returningVisitors: { type: Number, default: 0 },
    bounces: { type: Number, default: 0 },
    pageViews: { type: Map, of: Number, default: {} },
    devices: { type: Map, of: Number, default: {} },
    browsers: { type: Map, of: Number, default: {} },
    operatingSystems: { type: Map, of: Number, default: {} },
    countries: { type: Map, of: Number, default: {} },
    referrers: { type: Map, of: Number, default: {} },
  },
  {
    timestamps: true,
  },
);

export const DailyAnalytics: IDailyAnalyticsModel =
  mongoose.models.DailyAnalytics ||
  mongoose.model<IDailyAnalytics>("DailyAnalytics", dailyAnalyticsSchema);
