import mongoose, { Schema, Model, Types } from "mongoose";

// ============================================
// TechStack Model
// ============================================

export interface ITechStack {
  _id: Types.ObjectId;
  name: string;
  icon: string;
  color: string;
  order: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TechStackSchema = new Schema<ITechStack>(
  {
    name: { type: String, required: true },
    icon: { type: String, required: true },
    color: { type: String, required: true },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

TechStackSchema.index({ order: 1 });
TechStackSchema.index({ isVisible: 1 });

export const TechStack: Model<ITechStack> =
  mongoose.models.TechStack ||
  mongoose.model<ITechStack>("TechStack", TechStackSchema);
