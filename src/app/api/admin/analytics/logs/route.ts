import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@/server/services/analytics.service";
import { withAdmin } from "@/server/utils/auth-middleware";

export const GET = withAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const result = await analyticsService.getRecentHits(limit, page);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("[Admin Analytics Logs API Error]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics logs" },
      { status: 500 },
    );
  }
});
