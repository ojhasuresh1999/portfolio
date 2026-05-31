import nodemailer from "nodemailer";
import {
  emailTemplateService,
  interpolateTemplate,
} from "./email-template.service";

/**
 * Email Service
 * Handles sending emails via Gmail SMTP using Nodemailer + Google App Password
 */
export class EmailService {
  // ======================================================================
  // Private Transporter (created lazily before every send)
  // ======================================================================

  private createTransporter() {
    if (!process.env.GMAIL_USER) {
      throw new Error("GMAIL_USER is not set in environment variables");
    }
    if (!process.env.GMAIL_APP_PASSWORD) {
      throw new Error("GMAIL_APP_PASSWORD is not set in environment variables");
    }

    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  /**
   * Check Gmail SMTP is configured
   */
  private isConfigured(): boolean {
    return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  }

  /**
   * Send a direct custom HTML/Text email
   */
  async sendCustomEmail(options: {
    to: string;
    subject: string;
    bodyHtml: string;
    bodyText?: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.warn("Gmail SMTP not configured. Email not sent.");
      return { success: false, error: "Gmail SMTP not configured" };
    }

    try {
      const transporter = this.createTransporter();
      await transporter.sendMail({
        from: `"SURESH Support" <${process.env.GMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.bodyText || options.bodyHtml.replace(/<[^>]*>/g, ""),
        html: options.bodyHtml,
      });

      return { success: true };
    } catch (error) {
      console.error("Direct Custom Email Error:", error);
      const message =
        error instanceof Error ? error.message : "Unknown email error";
      return { success: false, error: message };
    }
  }

  // ======================================================================
  // Generic Template Sender
  // ======================================================================

  /**
   * Send an email using an admin-managed template.
   * Interpolates all variables before sending.
   */
  async sendTemplateEmail(options: {
    to: string | string[];
    templateType: string;
    vars: Record<string, string>;
    subjectPrefix?: string;
    unsubscribeUrl?: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.warn("Gmail SMTP not configured. Email not sent.");
      return { success: false, error: "Gmail SMTP not configured" };
    }

    const { to, templateType, vars, subjectPrefix = "" } = options;

    // Fetch the dynamic template
    const templateResult = await emailTemplateService.getByType(templateType);
    if (!templateResult.success) {
      console.error(
        `Failed to load email template ${templateType}:`,
        templateResult.error,
      );
      return { success: false, error: "Email template not available" };
    }

    if (!templateResult.data) {
      console.error(
        `Failed to load email template ${templateType}: no data returned`,
      );
      return { success: false, error: "Email template not available" };
    }

    const tmpl = templateResult.data;
    if (!tmpl.isActive) {
      console.info(`Template ${templateType} is inactive. Email not sent.`);
      return { success: true }; // silently skip
    }

    // Interpolate all template fields
    const resolvedSubject =
      subjectPrefix + interpolateTemplate(tmpl.subject, vars);
    const resolvedGreeting = interpolateTemplate(tmpl.greeting, vars);
    const resolvedBody = interpolateTemplate(tmpl.body, vars);
    const resolvedCtaText = interpolateTemplate(tmpl.ctaText, vars);
    const resolvedCtaUrl = interpolateTemplate(tmpl.ctaUrl, vars);
    const resolvedFooter = interpolateTemplate(tmpl.footerText, vars);

    // Convert newlines to <br> for body
    const bodyHtml = resolvedBody
      .split("\n")
      .map((line) =>
        line.trim() === ""
          ? "<br>"
          : `<p style="margin:0 0 12px 0;color:#cbd5e1;font-size:15px;line-height:1.7;">${line}</p>`,
      )
      .join("");

    const html = this.renderEmailHtml({
      subject: resolvedSubject,
      greeting: resolvedGreeting,
      bodyHtml,
      ctaText: resolvedCtaText,
      ctaUrl: resolvedCtaUrl,
      footerText: resolvedFooter,
      unsubscribeUrl: options.unsubscribeUrl,
    });

    try {
      const transporter = this.createTransporter();

      const toAddresses = Array.isArray(to) ? to : [to];

      await transporter.sendMail({
        from: `"SURESH" <${process.env.GMAIL_USER}>`,
        to: toAddresses[0],
        bcc: toAddresses.length > 1 ? toAddresses.slice(1) : undefined,
        subject: resolvedSubject,
        html,
      });

      console.info(`Email sent successfully for template: ${templateType}`);
      return { success: true };
    } catch (error) {
      console.error(`Gmail SMTP Error (${templateType}):`, error);
      const message =
        error instanceof Error ? error.message : "Unknown email error";
      return { success: false, error: message };
    }
  }

  // ======================================================================
  // Premium HTML Email Renderer
  // ======================================================================

  private renderEmailHtml(options: {
    subject: string;
    greeting: string;
    bodyHtml: string;
    ctaText: string;
    ctaUrl: string;
    footerText: string;
    unsubscribeUrl?: string;
  }): string {
    const {
      subject,
      greeting,
      bodyHtml,
      ctaText,
      ctaUrl,
      footerText,
      unsubscribeUrl,
    } = options;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1e;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%);border-radius:16px 16px 0 0;padding:40px 40px 30px;text-align:center;border:1px solid rgba(99,102,241,0.2);border-bottom:none;">
              <!-- Logo mark -->
              <div style="display:inline-block;background:rgba(0,240,255,0.1);border:1px solid rgba(0,240,255,0.3);border-radius:12px;padding:12px 20px;margin-bottom:20px;">
                <span style="font-family:monospace;font-size:18px;font-weight:900;letter-spacing:2px;color:#00f0ff;">SURESH</span>
              </div>
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${subject}</h1>
            </td>
          </tr>

          <!-- Green success strip -->
          <tr>
            <td style="background:linear-gradient(90deg,#10b981,#059669);height:3px;border-left:1px solid rgba(99,102,241,0.2);border-right:1px solid rgba(99,102,241,0.2);"></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#0f172a;padding:40px;border-left:1px solid rgba(99,102,241,0.2);border-right:1px solid rgba(99,102,241,0.2);">
              <p style="margin:0 0 20px;font-size:17px;font-weight:600;color:#e2e8f0;">${greeting}</p>
              ${bodyHtml}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:#0f172a;padding:0 40px 40px;text-align:center;border-left:1px solid rgba(99,102,241,0.2);border-right:1px solid rgba(99,102,241,0.2);">
              <a href="${ctaUrl}"
                style="display:inline-block;background:linear-gradient(135deg,#00f0ff,#6366f1);color:#000;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:0.5px;padding:14px 36px;border-radius:10px;margin-top:10px;">
                ${ctaText} →
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="background:#0f172a;padding:0 40px;border-left:1px solid rgba(99,102,241,0.2);border-right:1px solid rgba(99,102,241,0.2);">
              <div style="height:1px;background:rgba(255,255,255,0.06);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a,#0a0f1e);border-radius:0 0 16px 16px;padding:30px 40px;border:1px solid rgba(99,102,241,0.2);border-top:none;">
              <p style="margin:0 0 8px;font-size:12px;color:#64748b;text-align:center;line-height:1.6;">${footerText}</p>
              ${unsubscribeUrl ? `<p style="margin:0 0 12px;font-size:12px;text-align:center;"><a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe from these emails</a></p>` : ""}
              <p style="margin:0;font-size:11px;color:#334155;text-align:center;">
                &copy; ${new Date().getFullYear()} SURESH Portfolio. Built with ❤️ and Node.js.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}

export const emailService = new EmailService();
