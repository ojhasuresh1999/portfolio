import { NextRequest } from "next/server";
import { Api } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/error-handler";
import { validateBody, contactFormSchema } from "@/server/utils/validation";
import { checkRateLimit } from "@/server/utils/rate-limit";
import { getClientIp } from "@/server/utils/auth-middleware";
import { contactService } from "@/server/services/contact.service";
import { RateLimit } from "@/server/constants";

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit Contact Form
 *     description: Submit a new contact message (rate limited)
 *     tags:
 *       - Contact
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactForm'
 *     responses:
 *       201:
 *         description: Message submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad Request (Validation Error)
 *       422:
 *         description: Unprocessable Entity (Validation Error)
 *       429:
 *         description: Rate Limit Exceeded
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit for contact form
    const rateLimitResult = checkRateLimit(request, {
      prefix: "contact",
      maxRequests: RateLimit.CONTACT_FORM_MAX,
      windowMs: RateLimit.WINDOW_MS,
    });

    if (rateLimitResult.isLimited) {
      return Api.rateLimited(rateLimitResult.retryAfterSeconds);
    }

    // Validate request body
    const bodyResult = await validateBody(request, contactFormSchema);
    if (!bodyResult.success) {
      return Api.validationError(bodyResult.errors);
    }

    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || undefined;

    const result = await contactService.submit({
      ...bodyResult.data,
      ip,
      userAgent,
    });

    if (!result.success) {
      return Api.internalError(result.error);
    }

    return Api.created(
      { id: result.data.id },
      "Thank you for your message! I'll get back to you soon.",
    );
  } catch (error) {
    return handleError(error);
  }
}
