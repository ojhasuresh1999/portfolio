import mongoose, { Schema, Model, Types } from "mongoose";

// ============================================
// EmailTemplate Model
// Stores admin-managed email templates
// ============================================

export interface IEmailTemplate {
  _id: Types.ObjectId;
  /** Unique identifier for this template type e.g. "contact_auto_reply" */
  type: string;
  /** Email subject line. Supports {{name}}, {{subject}} variables */
  subject: string;
  /** Greeting line e.g. "Hi {{name}}," */
  greeting: string;
  /** Main body paragraphs. Supports all variables */
  body: string;
  /** Call-to-action button label */
  ctaText: string;
  /** Call-to-action button URL */
  ctaUrl: string;
  /** Footer text shown at the bottom of the email */
  footerText: string;
  /** Whether this template is active */
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    type: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      default: "Thanks for reaching out, {{name}}!",
    },
    greeting: {
      type: String,
      default: "Hi {{name}},",
    },
    body: {
      type: String,
      default:
        'Thank you for getting in touch! I\'ve received your message and will get back to you as soon as possible.\n\nYour message:\n"{{message}}"',
    },
    ctaText: {
      type: String,
      default: "Visit My Portfolio",
    },
    ctaUrl: {
      type: String,
      default: process.env.NEXT_PUBLIC_SITE_URL || "https://yourportfolio.com",
    },
    footerText: {
      type: String,
      default:
        "You will typically hear from me within 24–48 hours. This is an automated confirmation email.",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export const EmailTemplate: Model<IEmailTemplate> =
  mongoose.models.EmailTemplate ||
  mongoose.model<IEmailTemplate>("EmailTemplate", EmailTemplateSchema);
