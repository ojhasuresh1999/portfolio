import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@/server/services/analytics.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      path,
      referrer,
      fingerprint,
      screenResolution,
      language,
      timezone,
    } = body;

    if (!path) {
      return NextResponse.json(
        { success: false, error: "Path is required" },
        { status: 400 },
      );
    }

    // Extract basic headers for analytics
    const userAgent = request.headers.get("user-agent") || "";

    // Ignore bots
    const botPatterns = /bot|crawler|spider|crawling|headless|puppet|phantom/i;
    if (botPatterns.test(userAgent)) {
      return NextResponse.json({
        success: true,
        message: "Ignored bot traffic",
      });
    }

    // Get IP from various headers
    const cfIp = request.headers.get("cf-connecting-ip");
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip =
      cfIp ||
      (forwardedFor ? forwardedFor.split(",")[0].trim() : realIp) ||
      "unknown";

    await analyticsService.trackHit({
      path,
      referrer,
      userAgent,
      ip,
      fingerprint: fingerprint || "",
      screenResolution: screenResolution || "",
      language: language || "",
      timezone: timezone || "",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Analytics Track API Error]", error);
    // Don't leak error details to public endpoint
    return NextResponse.json(
      { success: false, error: "Failed to track hit" },
      { status: 500 },
    );
  }
}
