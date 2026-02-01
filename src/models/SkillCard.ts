import mongoose, { Schema, Model, Types } from "mongoose";

// ============================================
// SkillCard Model
// ============================================

export interface ISkillCard {
  _id: Types.ObjectId;
  title: string;
  description: string;
  icon: string;
  tags: string[];
  gridSpan: string;
  order: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SkillCardSchema = new Schema<ISkillCard>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    tags: { type: [String], default: [] },
    gridSpan: { type: String, default: "1" },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

SkillCardSchema.index({ order: 1 });
SkillCardSchema.index({ isVisible: 1 });

export const SkillCard: Model<ISkillCard> =
  mongoose.models.SkillCard ||
  mongoose.model<ISkillCard>("SkillCard", SkillCardSchema);
