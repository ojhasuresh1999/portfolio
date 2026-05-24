import mongoose, { Schema, Model, Types } from "mongoose";

// ============================================
// ContactSubmission Model
// ============================================

export interface IContactNote {
  _id?: Types.ObjectId;
  adminId: Types.ObjectId;
  adminName: string;
  content: string;
  createdAt: Date;
}

export interface IContactReply {
  _id?: Types.ObjectId;
  senderId: Types.ObjectId;
  senderName: string;
  message: string;
  createdAt: Date;
}

export interface IContactActivity {
  _id?: Types.ObjectId;
  type: string; // 'received' | 'status_change' | 'priority_change' | 'assigned' | 'reply_sent' | 'note_added' | 'tag_added' | 'tag_removed'
  actor: string; // admin name or "System"
  description: string;
  createdAt: Date;
}

export interface IContactSubmission {
  _id: Types.ObjectId;
  name: string;
  email: string;
  subject?: string;
  message: string;
  isRead: boolean;
  status: "new" | "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: Types.ObjectId;
  assignedToName?: string;
  tags: string[];
  notes: IContactNote[];
  replies: IContactReply[];
  activityLog: IContactActivity[];
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSubmissionSchema = new Schema<IContactSubmission>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["new", "open", "in_progress", "resolved", "closed"],
      default: "new",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    assignedToName: { type: String },
    tags: { type: [String], default: [] },
    notes: [
      {
        adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        adminName: { type: String, required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    replies: [
      {
        senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        senderName: { type: String, required: true },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    activityLog: [
      {
        type: { type: String, required: true },
        actor: { type: String, required: true },
        description: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);

ContactSubmissionSchema.index({ isRead: 1 });
ContactSubmissionSchema.index({ status: 1 });
ContactSubmissionSchema.index({ priority: 1 });
ContactSubmissionSchema.index({ assignedTo: 1 });
ContactSubmissionSchema.index({ tags: 1 });
ContactSubmissionSchema.index({ createdAt: -1 });

export const ContactSubmission: Model<IContactSubmission> =
  mongoose.models.ContactSubmission ||
  mongoose.model<IContactSubmission>(
    "ContactSubmission",
    ContactSubmissionSchema,
  );
