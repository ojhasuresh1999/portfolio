import { connectToDatabase } from "@/lib/mongodb";
import { EmailTemplate, type IEmailTemplate } from "@/models";
import type { ServiceResult } from "../types";

// ============================================
// Default fallback template (if DB is empty)
// ============================================
const DEFAULT_TEMPLATES: Record<string, Partial<IEmailTemplate>> = {
  contact_auto_reply: {
    type: "contact_auto_reply",
    subject: "Thanks for reaching out, {{name}}!",
    greeting: "Hi {{name}},",
    body: 'Thank you for getting in touch! I\'ve received your message and will get back to you as soon as possible.\n\nYour message:\n"{{message}}"',
    ctaText: "Visit My Portfolio",
    ctaUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://yourportfolio.com",
    footerText:
      "You'll typically hear from me within 24–48 hours. This is an automated confirmation.",
    isActive: true,
  },
  contact_admin_notice: {
    type: "contact_admin_notice",
    subject: "New Contact Message from {{name}}",
    greeting: "Hello Admin,",
    body: 'You have received a new message from your portfolio contact form.\n\nFrom: {{name}} ({{email}})\nSubject: {{subject}}\n\nMessage:\n"{{message}}"',
    ctaText: "View in Dashboard",
    ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://yourportfolio.com"}/admin/chat`,
    footerText: "This is an internal admin notification.",
    isActive: true,
  },
  chat_offline_user_notice: {
    type: "chat_offline_user_notice",
    subject: "I'm currently away - received your message",
    greeting: "Hi there,",
    body: 'Thank you for your chat message! I am currently away from my desk, but I have received your message and will get back to you as soon as I am online.\n\nYour message:\n"{{message}}"',
    ctaText: "Back to Portfolio",
    ctaUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://yourportfolio.com",
    footerText: "This is an automated away message.",
    isActive: true,
  },
  chat_admin_notice: {
    type: "chat_admin_notice",
    subject: "New Chat Message from {{name}}",
    greeting: "Hello Admin,",
    body: 'A user has sent a new chat message.\n\nFrom: {{name}}\n\nMessage:\n"{{message}}"',
    ctaText: "Open Chat",
    ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://yourportfolio.com"}/admin/chat`,
    footerText: "This is an internal admin notification.",
    isActive: true,
  },
  subscribe_user_welcome: {
    type: "subscribe_user_welcome",
    subject: "Welcome to NET_INSIGHTS!",
    greeting: "Welcome!",
    body: "Thank you for subscribing to NET_INSIGHTS. You will now receive updates whenever I publish new technical articles, tutorials, and insights.",
    ctaText: "Read Latest Articles",
    ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://yourportfolio.com"}/blog`,
    footerText: "You can unsubscribe at any time from the blog page.",
    isActive: true,
  },
  subscribe_admin_notice: {
    type: "subscribe_admin_notice",
    subject: "New Blog Subscriber: {{email}}",
    greeting: "Hello Admin,",
    body: "You have a new subscriber to NET_INSIGHTS!\n\nEmail: {{email}}",
    ctaText: "View Subscribers",
    ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://yourportfolio.com"}/admin/blog`,
    footerText: "This is an internal admin notification.",
    isActive: true,
  },
  blog_newsletter: {
    type: "blog_newsletter",
    subject: "New Post: {{blogTitle}}",
    greeting: "Hi there,",
    body: "I just published a new article on NET_INSIGHTS that you might find interesting.\n\n{{blogExcerpt}}",
    ctaText: "Read Full Article",
    ctaUrl: "{{blogUrl}}",
    footerText:
      "You are receiving this because you subscribed to NET_INSIGHTS.",
    isActive: true,
  },
};

/**
 * Interpolate template variables into a string
 * Supports: {{name}}, {{email}}, {{subject}}, {{message}}
 */
export function interpolateTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => vars[key] ?? `{{${key}}}`,
  );
}

/**
 * EmailTemplate Service
 * Handles CRUD for admin-managed email templates
 */
export class EmailTemplateService {
  private async ensureConnection(): Promise<void> {
    await connectToDatabase();
  }

  /**
   * Get a template by type, with fallback to defaults
   */
  async getByType(type: string): Promise<ServiceResult<IEmailTemplate>> {
    try {
      await this.ensureConnection();

      let template = await EmailTemplate.findOne({
        type,
      }).lean<IEmailTemplate>();

      if (!template) {
        // Seed default if missing
        const defaults = DEFAULT_TEMPLATES[type];
        if (defaults) {
          const created = await EmailTemplate.create(defaults);
          template = created.toObject() as IEmailTemplate;
        } else {
          return { success: false, error: `Template type "${type}" not found` };
        }
      }

      return { success: true, data: template };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch email template";
      return { success: false, error: message };
    }
  }

  /**
   * Create or update a template by type
   */
  async upsert(
    type: string,
    data: Partial<
      Omit<IEmailTemplate, "_id" | "type" | "createdAt" | "updatedAt">
    >,
  ): Promise<ServiceResult<IEmailTemplate>> {
    try {
      await this.ensureConnection();

      const template = await EmailTemplate.findOneAndUpdate(
        { type },
        { ...data, type },
        { new: true, upsert: true, runValidators: true },
      ).lean<IEmailTemplate>();

      return { success: true, data: template! };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save email template";
      return { success: false, error: message };
    }
  }

  /**
   * Get all templates (for admin listing)
   */
  async getAll(): Promise<ServiceResult<IEmailTemplate[]>> {
    try {
      await this.ensureConnection();
      const templates = await EmailTemplate.find()
        .sort({ type: 1 })
        .lean<IEmailTemplate[]>();
      return { success: true, data: templates };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch templates";
      return { success: false, error: message };
    }
  }
}

export const emailTemplateService = new EmailTemplateService();
