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
