import mongoose, { Schema, Model, Types } from "mongoose";

// ============================================
// Project Model
// ============================================

export interface IProject {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  longDescription?: string;
  image?: string;
  codeSnippet?: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
  accentColor: string;
  order: number;
  isFeatured: boolean;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    longDescription: { type: String },
    image: { type: String },
    codeSnippet: { type: String },
    technologies: { type: [String], default: [] },
    liveUrl: { type: String },
    githubUrl: { type: String },
    accentColor: { type: String, default: "primary" },
    order: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Note: unique: true on slug already creates an index
ProjectSchema.index({ isVisible: 1, isFeatured: 1 });
ProjectSchema.index({ order: 1 });

export const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
