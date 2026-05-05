import sgMail from "@sendgrid/mail";
import {
  emailTemplateService,
  interpolateTemplate,
} from "./email-template.service";

/**
 * Email Service
 * Handles sending emails via SendGrid
 */
export class EmailService {
  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  /**
   * Check SendGrid is configured
   */
  private isConfigured(): boolean {
    return !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL);
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
    subjectPrefix?: string; // Optional prefix like "[Urgent] "
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.warn("SendGrid not configured. Email not sent.");
      return { success: false, error: "SendGrid not configured" };
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
      subject: resolvedSubject, // Use resolved subject for title
      greeting: resolvedGreeting,
      bodyHtml,
      ctaText: resolvedCtaText,
      ctaUrl: resolvedCtaUrl,
      footerText: resolvedFooter,
    });

    try {
      const msg: sgMail.MailDataRequired = {
        to: Array.isArray(to) ? to[0] : to, // Send to the first or single recipient
        bcc: Array.isArray(to) && to.length > 1 ? to.slice(1) : undefined, // BCC the rest if array
        from: process.env.SENDGRID_FROM_EMAIL!,
        subject: resolvedSubject,
        html,
      };

      await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      console.error(`SendGrid Error (${templateType}):`, error);
      const message =
        error instanceof Error ? error.message : "Unknown SendGrid error";
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
  }): string {
    const { subject, greeting, bodyHtml, ctaText, ctaUrl, footerText } =
      options;

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
                <span style="font-family:monospace;font-size:18px;font-weight:900;letter-spacing:2px;color:#00f0ff;">DEV_IO</span>
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
              <p style="margin:0;font-size:11px;color:#334155;text-align:center;">
                &copy; ${new Date().getFullYear()} DEV_IO Portfolio. Built with ❤️ and Node.js.
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
