import { NextResponse } from "next/server";
import { analyticsService } from "@/server/services/analytics.service";
import { withAdmin } from "@/server/utils/auth-middleware";

export const GET = withAdmin(async () => {
  try {
    const [dailyStats, distributions, topPaths] = await Promise.all([
      analyticsService.getDailyStats(30),
      analyticsService.getDistributions(),
      analyticsService.getTopPaths(10),
    ]);

    // Let's do a proper count for total hits
    const recentHits = await analyticsService.getRecentHits(1);
    const totalHits = recentHits.success ? recentHits.data?.total || 0 : 0;

    return NextResponse.json({
      success: true,
      data: {
        daily: dailyStats.success ? dailyStats.data : [],
        distributions: distributions.success
          ? distributions.data
          : { browser: [], os: [], device: [] },
        topPaths: topPaths.success ? topPaths.data : [],
        totalHits,
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
