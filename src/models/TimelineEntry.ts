import mongoose, { Schema, Model, Types } from "mongoose";

// ============================================
// TimelineEntry Model
// ============================================

export interface ITimelineEntry {
  _id: Types.ObjectId;
  year: string;
  title: string;
  description: string;
  order: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineEntrySchema = new Schema<ITimelineEntry>(
  {
    year: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

TimelineEntrySchema.index({ order: 1 });
TimelineEntrySchema.index({ isVisible: 1 });

export const TimelineEntry: Model<ITimelineEntry> =
  mongoose.models.TimelineEntry ||
  mongoose.model<ITimelineEntry>("TimelineEntry", TimelineEntrySchema);
