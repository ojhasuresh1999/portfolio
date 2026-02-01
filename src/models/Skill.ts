import mongoose, { Schema, Model, Types } from "mongoose";

// ============================================
// Skill Model
// ============================================

export enum SkillCategory {
  LANGUAGE = "LANGUAGE",
  DATABASE = "DATABASE",
  DEVOPS = "DEVOPS",
  FRAMEWORK = "FRAMEWORK",
  TOOL = "TOOL",
}

export interface ISkill {
  _id: Types.ObjectId;
  name: string;
  proficiency: number;
  category: SkillCategory;
  order: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SkillSchema = new Schema<ISkill>(
  {
    name: { type: String, required: true },
    proficiency: { type: Number, required: true, min: 0, max: 100 },
    category: {
      type: String,
      enum: Object.values(SkillCategory),
      required: true,
    },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

SkillSchema.index({ category: 1 });
SkillSchema.index({ order: 1 });
SkillSchema.index({ isVisible: 1 });

export const Skill: Model<ISkill> =
  mongoose.models.Skill || mongoose.model<ISkill>("Skill", SkillSchema);
