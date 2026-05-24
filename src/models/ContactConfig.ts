import mongoose, { Schema, Model, Types } from "mongoose";

// ============================================
// ContactConfig Model
// ============================================

export interface IQuickReply {
  id: string;
  title: string;
  content: string;
}

export interface IContactConfig {
  _id: Types.ObjectId;
  slaHours: number;
  quickReplies: IQuickReply[];
  tags: string[];
  autoReplyTemplateSubject: string;
  autoReplyTemplateBody: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactConfigSchema = new Schema<IContactConfig>(
  {
    slaHours: { type: Number, default: 24 },
    quickReplies: {
      type: [
        {
          id: { type: String, required: true },
          title: { type: String, required: true },
          content: { type: String, required: true },
        },
      ],
      default: [
        {
          id: "general_thanks",
          title: "General Thanks",
          content:
            "Hi {{name}},\n\nThanks for reaching out! I've received your inquiry and will look into it shortly. Let me know if you have any additional details to share.\n\nBest regards,\nSuresh",
        },
        {
          id: "collaboration_inquiry",
          title: "Collaboration Interest",
          content:
            "Hi {{name}},\n\nThank you for your interest in collaborating! I am always excited to discuss new opportunities. Let's schedule a brief call next week to explore how we might work together.\n\nBest,\nSuresh",
        },
        {
          id: "bug_report",
          title: "Bug Report Acknowledged",
          content:
            "Hi {{name}},\n\nThank you for reporting this issue! I've opened an internal ticket to investigate the bug you described. I'll follow up as soon as I have an update or need more information.\n\nBest,\nSuresh",
        },
      ],
    },
    tags: {
      type: [String],
      default: ["billing", "bug", "partnership", "general", "feedback"],
    },
    autoReplyTemplateSubject: {
      type: String,
      default: "Thanks for reaching out, {{name}}!",
    },
    autoReplyTemplateBody: {
      type: String,
      default:
        'Hi {{name}},\n\nThank you for getting in touch! I\'ve received your message and will get back to you as soon as possible.\n\nYour message:\n"{{message}}"\n\nBest regards,\nSuresh',
    },
  },
  { timestamps: true },
);

export const ContactConfig: Model<IContactConfig> =
  mongoose.models.ContactConfig ||
  mongoose.model<IContactConfig>("ContactConfig", ContactConfigSchema);
