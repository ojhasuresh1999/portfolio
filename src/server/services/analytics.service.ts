import { connectToDatabase } from "@/lib/mongodb";
import { Analytics, IAnalytics } from "@/models/Analytics";
import { UAParser } from "ua-parser-js";
import { ServiceResult } from "../types";

export interface TrackHitInput {
  path: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
}

export class AnalyticsService {
  /**
   * Track a new page hit
   */
  async trackHit(input: TrackHitInput): Promise<ServiceResult<IAnalytics>> {
    try {
      await connectToDatabase();

      // Parse User Agent
      let browser = "Unknown";
      let os = "Unknown";
      let device = "Desktop";

      if (input.userAgent) {
        const parser = new UAParser(input.userAgent);
        const browserResult = parser.getBrowser();
        const osResult = parser.getOS();
        const deviceResult = parser.getDevice();

        if (browserResult.name) {
          browser =
            `${browserResult.name} ${browserResult.version || ""}`.trim();
        }
        if (osResult.name) {
          os = `${osResult.name} ${osResult.version || ""}`.trim();
        }
        if (deviceResult.type) {
          device =
            deviceResult.type === "mobile"
              ? "Mobile"
              : deviceResult.type === "tablet"
                ? "Tablet"
                : "Desktop";
        }
      }

      // Anonymize IP (optional, but good practice)
      let anonymizedIp = "";
      if (input.ip && input.ip !== "unknown") {
        // Simple anonymization: remove last octet for IPv4
        anonymizedIp = input.ip.includes(":")
          ? input.ip.split(":").slice(0, 3).join(":") + ":0000" // IPv6 basic anonymization
          : input.ip.split(".").slice(0, 3).join(".") + ".0"; // IPv4
      }

      const hit = new Analytics({
        path: input.path,
        referrer: input.referrer || "",
        userAgent: input.userAgent || "",
        ip: anonymizedIp,
        browser,
        os,
        device,
      });

      const savedHit = await hit.save();
      return { success: true, data: savedHit.toObject() as IAnalytics };
    } catch (error) {
      console.error("[AnalyticsService.trackHit] Error:", error);
      return { success: false, error: "Failed to track hit" };
    }
  }

  /**
   * Get total hits grouped by a period (e.g., daily for the last 30 days)
   */
  async getDailyStats(
    days: number = 30,
  ): Promise<ServiceResult<{ date: string; hits: number }[]>> {
    try {
      await connectToDatabase();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await Analytics.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            hits: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      const formattedStats = stats.map((stat) => ({
        date: stat._id,
        hits: stat.hits,
      }));

      return { success: true, data: formattedStats };
    } catch (error) {
      console.error("[AnalyticsService.getDailyStats] Error:", error);
      return { success: false, error: "Failed to get daily stats" };
    }
  }

  /**
   * Get distributions (browser, os, device)
   */
  async getDistributions(): Promise<
    ServiceResult<{
      browser: { name: string; value: number }[];
      os: { name: string; value: number }[];
      device: { name: string; value: number }[];
    }>
  > {
    try {
      await connectToDatabase();

      const [browser, os, device] = await Promise.all([
        Analytics.aggregate([
          { $group: { _id: "$browser", value: { $sum: 1 } } },
          { $project: { name: "$_id", value: 1, _id: 0 } },
          { $sort: { value: -1 } },
        ]),
        Analytics.aggregate([
          { $group: { _id: "$os", value: { $sum: 1 } } },
          { $project: { name: "$_id", value: 1, _id: 0 } },
          { $sort: { value: -1 } },
        ]),
        Analytics.aggregate([
          { $group: { _id: "$device", value: { $sum: 1 } } },
          { $project: { name: "$_id", value: 1, _id: 0 } },
          { $sort: { value: -1 } },
        ]),
      ]);

      return { success: true, data: { browser, os, device } };
    } catch (error) {
      console.error("[AnalyticsService.getDistributions] Error:", error);
      return { success: false, error: "Failed to get distributions" };
    }
  }

  /**
   * Get top paths
   */
  async getTopPaths(
    limit: number = 10,
  ): Promise<ServiceResult<{ path: string; hits: number }[]>> {
    try {
      await connectToDatabase();
      const topPaths = await Analytics.aggregate([
        { $group: { _id: "$path", hits: { $sum: 1 } } },
        { $sort: { hits: -1 } },
        { $limit: limit },
        { $project: { path: "$_id", hits: 1, _id: 0 } },
      ]);
      return { success: true, data: topPaths };
    } catch (error) {
      console.error("[AnalyticsService.getTopPaths] Error:", error);
      return { success: false, error: "Failed to get top paths" };
    }
  }

  /**
   * Get recent hits list
   */
  async getRecentHits(
    limit: number = 50,
    page: number = 1,
  ): Promise<ServiceResult<{ items: IAnalytics[]; total: number }>> {
    try {
      await connectToDatabase();
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        Analytics.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        Analytics.countDocuments(),
      ]);

      return { success: true, data: { items: items as IAnalytics[], total } };
    } catch (error) {
      console.error("[AnalyticsService.getRecentHits] Error:", error);
      return { success: false, error: "Failed to get recent hits" };
    }
  }
}

export const analyticsService = new AnalyticsService();
