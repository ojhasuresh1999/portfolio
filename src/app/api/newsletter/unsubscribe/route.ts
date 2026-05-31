import { subscriberService } from "@/server/services/subscriber.service";
import { ApiResponseBuilder } from "@/server/utils/api-response";
import { verifyUnsubscribeToken } from "@/server/utils/jwt.util";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, token } = body;

    let targetEmail = email;

    // If token is provided, verify it to get the email (most secure, 1-click style)
    if (token) {
      const decoded = verifyUnsubscribeToken(token);
      if (!decoded) {
        return ApiResponseBuilder.error(
          "Invalid or expired unsubscribe link",
          400,
        );
      }
      targetEmail = decoded.email;
    }

    if (!targetEmail) {
      return ApiResponseBuilder.error("Email is required to unsubscribe", 400);
    }

    const result = await subscriberService.unsubscribe(targetEmail);

    if (!result.success) {
      return ApiResponseBuilder.error(
        result.error || "Failed to unsubscribe",
        400,
      );
    }

    return ApiResponseBuilder.success(
      result.data,
      "Successfully unsubscribed from newsletter",
    );
  } catch (error) {
    console.error("Newsletter Unsubscribe Error:", error);
    return ApiResponseBuilder.error("Internal Server Error", 500);
  }
}
