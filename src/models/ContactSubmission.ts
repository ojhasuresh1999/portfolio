import mongoose, { Schema, Model, Types } from "mongoose";

// ============================================
// ContactSubmission Model
// ============================================

export interface IContactSubmission {
  _id: Types.ObjectId;
  name: string;
  email: string;
  subject?: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const ContactSubmissionSchema = new Schema<IContactSubmission>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ContactSubmissionSchema.index({ isRead: 1 });
ContactSubmissionSchema.index({ createdAt: -1 });

export const ContactSubmission: Model<IContactSubmission> =
  mongoose.models.ContactSubmission ||
  mongoose.model<IContactSubmission>(
    "ContactSubmission",
    ContactSubmissionSchema,
  );
