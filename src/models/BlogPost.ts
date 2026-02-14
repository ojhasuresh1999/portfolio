import mongoose, { Schema, Model, Types } from "mongoose";
import {
  slugGeneratorPlugin,
  type SlugModel,
} from "@/lib/mongoose-plugins/slugGenerator";

// ============================================
// BlogPost Model
// ============================================

export interface IBlogPost {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string[];
  readTime: number;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBlogPostModel
  extends Model<IBlogPost>, SlugModel<IBlogPost> {}

const BlogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true },
    // slug is added automatically by the slugGenerator plugin
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    coverImage: { type: String },
    category: { type: String, required: true },
    tags: { type: [String], default: [] },
    readTime: { type: Number, default: 5 },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

// ── Plugins ────────────────────────────────
BlogPostSchema.plugin(slugGeneratorPlugin, { sourceField: "title" });

// ── Indexes ────────────────────────────────
// Note: slug unique index is created by the plugin
BlogPostSchema.index({ isPublished: 1, publishedAt: -1 });
BlogPostSchema.index({ category: 1 });
BlogPostSchema.index({ title: "text", content: "text", excerpt: "text" });

export const BlogPost: IBlogPostModel =
  (mongoose.models.BlogPost as IBlogPostModel) ||
  mongoose.model<IBlogPost, IBlogPostModel>("BlogPost", BlogPostSchema);
