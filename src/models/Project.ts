import mongoose, { Schema, Model, Types } from "mongoose";
import {
  slugGeneratorPlugin,
  type SlugModel,
} from "@/lib/mongoose-plugins/slugGenerator";

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
  status: "ongoing" | "completed" | "on-hold" | "archived";
  order: number;
  isFeatured: boolean;
  isVisible: boolean;
  isSourceCodeVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectModel extends Model<IProject>, SlugModel<IProject> {}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    longDescription: { type: String },
    image: { type: String },
    codeSnippet: { type: String },
    technologies: { type: [String], default: [] },
    liveUrl: { type: String },
    githubUrl: { type: String },
    accentColor: { type: String, default: "primary" },
    status: {
      type: String,
      enum: ["ongoing", "completed", "on-hold", "archived"],
      default: "completed",
    },
    order: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
    isSourceCodeVisible: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// ── Plugins ────────────────────────────────
ProjectSchema.plugin(slugGeneratorPlugin, { sourceField: "title" });

// ── Indexes ────────────────────────────────
// Note: slug unique index is created by the plugin
ProjectSchema.index({ isVisible: 1, isFeatured: 1 });
ProjectSchema.index({ order: 1 });

if (mongoose.models && mongoose.models.Project) {
  Reflect.deleteProperty(mongoose.models, "Project");
}

export const Project: IProjectModel = mongoose.model<IProject, IProjectModel>(
  "Project",
  ProjectSchema,
);
