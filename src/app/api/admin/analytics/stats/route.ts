import { NextResponse } from "next/server";
import { analyticsService } from "@/server/services/analytics.service";
import { withAdmin } from "@/server/utils/auth-middleware";

export const GET = withAdmin(async () => {
  try {
    const result = await analyticsService.getAdvancedStats(30);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }

    // Also include legacy-shaped data for backward compat
    const [dailyStats, distributions, topPaths, totalPageViews] =
      await Promise.all([
        analyticsService.getDailyStats(30),
        analyticsService.getDistributions(),
        analyticsService.getTopPaths(10),
        analyticsService.getTotalPageViews(),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        // New advanced stats
        advanced: result.data,
        // Legacy shape (for any existing widgets that depend on it)
        daily: dailyStats.success ? dailyStats.data : [],
        distributions: distributions.success
          ? distributions.data
          : { browser: [], os: [], device: [] },
        topPaths: topPaths.success ? topPaths.data : [],
        totalHits: totalPageViews.success ? totalPageViews.data : 0,
      },
    });
  } catch (error) {
    console.error("[Admin Analytics Stats API Error]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics stats" },
      { status: 500 },
    );
  }
});
