import { subscriberService } from "@/server/services/subscriber.service";
import { ApiResponseBuilder } from "@/server/utils/api-response";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return ApiResponseBuilder.error("Email is required", 400);
    }

    const result = await subscriberService.subscribe(email);

    if (!result.success) {
      return ApiResponseBuilder.error(
        result.error || "Failed to subscribe",
        400,
      );
    }

    return ApiResponseBuilder.success(
      result.data,
      "Successfully subscribed to newsletter",
    );
  } catch (error) {
    console.error("Newsletter Subscription Error:", error);
    return ApiResponseBuilder.error("Internal Server Error", 500);
  }
}
