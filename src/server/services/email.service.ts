import sgMail from "@sendgrid/mail";

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
   * Send a newsletter email to all active subscribers
   */
  async sendNewBlogPostNotification(options: {
    blogTitle: string;
    blogExcerpt: string;
    blogUrl: string;
    subscribers: string[];
    coverImage?: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn("SENDGRID_API_KEY not found. Email not sent.");
      return { success: false, error: "SendGrid API Key not configured" };
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      console.warn("SENDGRID_FROM_EMAIL not found. Email not sent.");
      return { success: false, error: "SendGrid From Email not configured" };
    }

    const { blogTitle, blogExcerpt, blogUrl, subscribers, coverImage } =
      options;

    if (subscribers.length === 0) return { success: true };

    const msg = {
      to: subscribers,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `New Blog Post: ${blogTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          ${coverImage ? `<img src="${coverImage}" alt="${blogTitle}" style="width: 100%; border-radius: 5px; margin-bottom: 20px;">` : ""}
          <h1 style="color: #333; margin-bottom: 10px;">${blogTitle}</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">${blogExcerpt}</p>
          <a href="${blogUrl}" style="display: inline-block; background-color: #00f0ff; color: #000; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 20px;">Read More</a>
          <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; text-align: center;">You're receiving this because you subscribed to Net Insights.</p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      console.error("SendGrid Error:", error);
      const message =
        error instanceof Error ? error.message : "Unknown SendGrid error";
      return { success: false, error: message };
    }
  }
}

export const emailService = new EmailService();
