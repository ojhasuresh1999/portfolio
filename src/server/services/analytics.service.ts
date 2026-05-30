import { connectToDatabase } from "@/lib/mongodb";
import { Visitor } from "@/models/Visitor";
import { DailyAnalytics } from "@/models/DailyAnalytics";
import { Analytics } from "@/models/Analytics";
import { UAParser } from "ua-parser-js";
import { ServiceResult } from "../types";
import crypto from "crypto";

// =============================================================================
// Advanced Analytics Service — Production-Level
//
// Architecture:
//   • Visitor model     → 1 doc per unique device (fingerprint-based)
//   • DailyAnalytics    → 1 doc per calendar day (pre-aggregated counters)
//   • Old Analytics col → Kept for backward compat, no longer primary
//
// DB growth = O(unique_visitors + days), NOT O(page_views)
// =============================================================================

export interface TrackHitInput {
  path: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
  fingerprint?: string;
  screenResolution?: string;
  language?: string;
  timezone?: string;
}

interface VisitorOverview {
  totalUniqueVisitors: number;
  todayUniqueVisitors: number;
  weekUniqueVisitors: number;
  monthUniqueVisitors: number;
  newVisitorsToday: number;
  returningVisitorsToday: number;
  avgPagesPerVisitor: number;
  bounceRate: number;
  activeVisitors: number; // last 5 min
}

interface DailyTrend {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
  newVisitors: number;
  returningVisitors: number;
  bounceRate: number;
}

interface Distribution {
  name: string;
  value: number;
}

interface TopPage {
  path: string;
  views: number;
  uniqueVisitors: number;
}

interface AdvancedStats {
  overview: VisitorOverview;
  dailyTrend: DailyTrend[];
  distributions: {
    browser: Distribution[];
    os: Distribution[];
    device: Distribution[];
    country: Distribution[];
  };
  topPages: TopPage[];
  topReferrers: Distribution[];
  recentVisitors: {
    fingerprintHash: string;
    browser: string;
    os: string;
    device: string;
    country: string;
    pages: string[];
    totalVisits: number;
    lastSeen: string;
    firstSeen: string;
  }[];
}

/**
 * Get today's date string in YYYY-MM-DD format (UTC)
 */
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get date string N days ago
 */
function getDateStringDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

/**
 * Anonymize IP: remove last octet for IPv4, last 5 groups for IPv6
 */
function anonymizeIp(ip: string): string {
  if (!ip || ip === "unknown") return "";
  if (ip.includes(":")) {
    return ip.split(":").slice(0, 3).join(":") + ":0000";
  }
  return ip.split(".").slice(0, 3).join(".") + ".0";
}

/**
 * Sanitize map key for MongoDB: dots and $ are not allowed in map keys
 */
function sanitizeMapKey(key: string): string {
  return key.replace(/\./g, "_").replace(/\$/g, "_").slice(0, 80) || "unknown";
}

export class AnalyticsService {
  /**
   * Track a page view — production level:
   *   1. Upsert Visitor (one doc per device)
   *   2. Upsert DailyAnalytics (one doc per day, atomic $inc)
   *   3. Also write to legacy Analytics for backward compat
   */
  async trackHit(
    input: TrackHitInput,
  ): Promise<ServiceResult<{ tracked: boolean; isNew: boolean }>> {
    try {
      await connectToDatabase();

      // Parse user-agent
      let browser = "Unknown";
      let os = "Unknown";
      let device = "Desktop";

      if (input.userAgent) {
        const parser = new UAParser(input.userAgent);
        const br = parser.getBrowser();
        const osR = parser.getOS();
        const dv = parser.getDevice();

        if (br.name) browser = `${br.name} ${br.version || ""}`.trim();
        if (osR.name) os = `${osR.name} ${osR.version || ""}`.trim();
        if (dv.type) {
          device =
            dv.type === "mobile"
              ? "Mobile"
              : dv.type === "tablet"
                ? "Tablet"
                : "Desktop";
        }
      }

      const anonymizedIp = anonymizeIp(input.ip || "");

      // Generate fingerprint hash if client didn't send one (fallback to IP + UA)
      const fingerprintHash = input.fingerprint
        ? crypto.createHash("sha256").update(input.fingerprint).digest("hex")
        : crypto
            .createHash("sha256")
            .update(
              `${input.userAgent || ""}|${input.ip || ""}|${input.screenResolution || ""}`,
            )
            .digest("hex");

      const today = getTodayString();
      const now = new Date();
      const pathKey = sanitizeMapKey(input.path);
      const browserKey = sanitizeMapKey(browser);
      const osKey = sanitizeMapKey(os);
      const deviceKey = sanitizeMapKey(device);
      const referrerDomain = this.extractReferrerDomain(input.referrer || "");
      const referrerKey = sanitizeMapKey(referrerDomain || "direct");

      // -------------------------------------------------------------------
      // 1) Upsert Visitor
      // -------------------------------------------------------------------
      const existingVisitor = await Visitor.findOne({ fingerprintHash });
      const isNewVisitor = !existingVisitor;

      if (existingVisitor) {
        // Returning visitor: update lastSeen, increment visits, add page
        await Visitor.updateOne(
          { fingerprintHash },
          {
            $set: {
              lastSeen: now,
              browser,
              os,
              device,
              lastIp: anonymizedIp,
              ...(input.screenResolution && {
                screenResolution: input.screenResolution,
              }),
              ...(input.language && { language: input.language }),
              ...(input.timezone && { timezone: input.timezone }),
            },
            $inc: { totalVisits: 1 },
            $addToSet: { pages: input.path },
          },
        );
      } else {
        // New visitor
        await Visitor.create({
          fingerprintHash,
          firstSeen: now,
          lastSeen: now,
          totalVisits: 1,
          pages: [input.path],
          browser,
          os,
          device,
          screenResolution: input.screenResolution || "",
          language: input.language || "",
          timezone: input.timezone || "",
          referrer: input.referrer || "",
          lastIp: anonymizedIp,
        });
      }

      // -------------------------------------------------------------------
      // 2) Upsert DailyAnalytics (atomic — safe under concurrency)
      // -------------------------------------------------------------------
      const dailyUpdate: Record<string, unknown> = {
        $inc: {
          totalPageViews: 1,
          [`pageViews.${pathKey}`]: 1,
          [`devices.${deviceKey}`]: 1,
          [`browsers.${browserKey}`]: 1,
          [`operatingSystems.${osKey}`]: 1,
          [`referrers.${referrerKey}`]: 1,
        },
        $addToSet: {
          uniqueVisitorHashes: fingerprintHash,
        },
      };

      if (isNewVisitor) {
        (dailyUpdate.$inc as Record<string, number>).newVisitors = 1;
      } else {
        (dailyUpdate.$inc as Record<string, number>).returningVisitors = 1;
      }

      await DailyAnalytics.findOneAndUpdate({ date: today }, dailyUpdate, {
        upsert: true,
        new: true,
      });

      // -------------------------------------------------------------------
      // 3) Legacy write (backwards compat — can be removed later)
      // -------------------------------------------------------------------
      const legacyHit = new Analytics({
        path: input.path,
        referrer: input.referrer || "",
        userAgent: input.userAgent || "",
        ip: anonymizedIp,
        browser,
        os,
        device,
      });
      await legacyHit.save();

      return { success: true, data: { tracked: true, isNew: isNewVisitor } };
    } catch (error) {
      console.error("[AnalyticsService.trackHit] Error:", error);
      return { success: false, error: "Failed to track hit" };
    }
  }

  /**
   * Get comprehensive advanced stats for the admin dashboard
   */
  async getAdvancedStats(
    days: number = 30,
  ): Promise<ServiceResult<AdvancedStats>> {
    try {
      await connectToDatabase();

      const today = getTodayString();
      const startDate = getDateStringDaysAgo(days);
      const weekAgo = getDateStringDaysAgo(7);
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

      // Parallel fetch everything
      const [
        totalUniqueVisitors,
        todayDoc,
        weekDocs,
        dailyDocs,
        activeVisitors,
        topVisitors,
        allVisitorDevices,
        allVisitorBrowsers,
        allVisitorOS,
        allVisitorCountries,
      ] = await Promise.all([
        // Total unique visitors all-time
        Visitor.countDocuments(),

        // Today's aggregated doc
        DailyAnalytics.findOne({ date: today }).lean(),

        // Last 7 days docs
        DailyAnalytics.find({ date: { $gte: weekAgo } }).lean(),

        // Last N days docs (for trend chart)
        DailyAnalytics.find({ date: { $gte: startDate } })
          .sort({ date: 1 })
          .lean(),

        // Active visitors (last 5 minutes)
        Visitor.countDocuments({ lastSeen: { $gte: fiveMinAgo } }),

        // Recent visitors for log table
        Visitor.find()
          .sort({ lastSeen: -1 })
          .limit(50)
          .select(
            "fingerprintHash browser os device country pages totalVisits lastSeen firstSeen",
          )
          .lean(),

        // Device distribution from Visitor collection (unique visitors, not hits)
        Visitor.aggregate([
          { $group: { _id: "$device", value: { $sum: 1 } } },
          { $project: { name: "$_id", value: 1, _id: 0 } },
          { $sort: { value: -1 } },
        ]),

        // Browser distribution from Visitor collection
        Visitor.aggregate([
          { $group: { _id: "$browser", value: { $sum: 1 } } },
          { $project: { name: "$_id", value: 1, _id: 0 } },
          { $sort: { value: -1 } },
          { $limit: 10 },
        ]),

        // OS distribution from Visitor collection
        Visitor.aggregate([
          { $group: { _id: "$os", value: { $sum: 1 } } },
          { $project: { name: "$_id", value: 1, _id: 0 } },
          { $sort: { value: -1 } },
          { $limit: 10 },
        ]),

        // Country distribution from Visitor collection
        Visitor.aggregate([
          { $group: { _id: "$country", value: { $sum: 1 } } },
          { $project: { name: "$_id", value: 1, _id: 0 } },
          { $sort: { value: -1 } },
          { $limit: 15 },
        ]),
      ]);

      // Calculate overview KPIs
      const todayUniqueVisitors = todayDoc?.uniqueVisitorHashes?.length || 0;
      const weekUniqueSet = new Set<string>();
      const monthUniqueSet = new Set<string>();

      for (const doc of weekDocs) {
        for (const hash of doc.uniqueVisitorHashes || []) {
          weekUniqueSet.add(hash);
        }
      }

      for (const doc of dailyDocs) {
        for (const hash of doc.uniqueVisitorHashes || []) {
          monthUniqueSet.add(hash);
        }
      }

      // Average pages per visitor
      const avgPagesResult = await Visitor.aggregate([
        { $project: { pageCount: { $size: "$pages" } } },
        { $group: { _id: null, avg: { $avg: "$pageCount" } } },
      ]);
      const avgPagesPerVisitor = avgPagesResult[0]?.avg || 0;

      // Bounce rate (visitors with only 1 page)
      const singlePageVisitors = await Visitor.countDocuments({
        $expr: { $eq: [{ $size: "$pages" }, 1] },
      });
      const bounceRate =
        totalUniqueVisitors > 0
          ? Math.round((singlePageVisitors / totalUniqueVisitors) * 100)
          : 0;

      // Build daily trend
      const dailyTrend: DailyTrend[] = dailyDocs.map((doc) => ({
        date: doc.date,
        pageViews: doc.totalPageViews || 0,
        uniqueVisitors: doc.uniqueVisitorHashes?.length || 0,
        newVisitors: doc.newVisitors || 0,
        returningVisitors: doc.returningVisitors || 0,
        bounceRate:
          (doc.uniqueVisitorHashes?.length || 0) > 0
            ? Math.round(
                ((doc.bounces || 0) / (doc.uniqueVisitorHashes?.length || 1)) *
                  100,
              )
            : 0,
      }));

      // Top pages — merge from daily docs
      const pageTotals = new Map<
        string,
        { views: number; visitors: Set<string> }
      >();
      for (const doc of dailyDocs) {
        if (doc.pageViews) {
          const pvMap =
            doc.pageViews instanceof Map
              ? doc.pageViews
              : new Map(Object.entries(doc.pageViews));
          for (const [path, count] of pvMap) {
            const existing = pageTotals.get(path) || {
              views: 0,
              visitors: new Set(),
            };
            existing.views += count as number;
            // We don't have per-page unique visitors from daily doc, approximate
            pageTotals.set(path, existing);
          }
        }
      }

      // Get per-page unique visitors from Visitor collection
      const pageVisitorCounts = await Visitor.aggregate([
        { $unwind: "$pages" },
        { $group: { _id: "$pages", uniqueVisitors: { $sum: 1 } } },
        { $sort: { uniqueVisitors: -1 } },
        { $limit: 15 },
      ]);

      const topPages: TopPage[] = pageVisitorCounts.map((pv) => ({
        path: pv._id,
        views: pageTotals.get(sanitizeMapKey(pv._id))?.views || 0,
        uniqueVisitors: pv.uniqueVisitors,
      }));

      // Top referrers — merge from daily docs
      const referrerTotals = new Map<string, number>();
      for (const doc of dailyDocs) {
        if (doc.referrers) {
          const refMap =
            doc.referrers instanceof Map
              ? doc.referrers
              : new Map(Object.entries(doc.referrers));
          for (const [ref, count] of refMap) {
            referrerTotals.set(
              ref,
              (referrerTotals.get(ref) || 0) + (count as number),
            );
          }
        }
      }
      const topReferrers: Distribution[] = Array.from(referrerTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));

      // Format recent visitors
      const recentVisitors = topVisitors.map((v) => ({
        fingerprintHash: (v.fingerprintHash as string).slice(0, 12) + "…",
        browser: v.browser as string,
        os: v.os as string,
        device: v.device as string,
        country: v.country as string,
        pages: v.pages as string[],
        totalVisits: v.totalVisits as number,
        lastSeen: (v.lastSeen as Date).toISOString(),
        firstSeen: (v.firstSeen as Date).toISOString(),
      }));

      const overview: VisitorOverview = {
        totalUniqueVisitors,
        todayUniqueVisitors,
        weekUniqueVisitors: weekUniqueSet.size,
        monthUniqueVisitors: monthUniqueSet.size,
        newVisitorsToday: todayDoc?.newVisitors || 0,
        returningVisitorsToday: todayDoc?.returningVisitors || 0,
        avgPagesPerVisitor: Math.round(avgPagesPerVisitor * 10) / 10,
        bounceRate,
        activeVisitors,
      };

      return {
        success: true,
        data: {
          overview,
          dailyTrend,
          distributions: {
            browser: allVisitorBrowsers,
            os: allVisitorOS,
            device: allVisitorDevices,
            country: allVisitorCountries,
          },
          topPages,
          topReferrers,
          recentVisitors,
        },
      };
    } catch (error) {
      console.error("[AnalyticsService.getAdvancedStats] Error:", error);
      return { success: false, error: "Failed to get advanced stats" };
    }
  }

  /**
   * Get total unique visitors count (for dashboard cards)
   */
  async getTotalUniqueVisitors(): Promise<ServiceResult<number>> {
    try {
      await connectToDatabase();
      const count = await Visitor.countDocuments();
      return { success: true, data: count };
    } catch (error) {
      console.error("[AnalyticsService.getTotalUniqueVisitors] Error:", error);
      return { success: false, error: "Failed to count unique visitors" };
    }
  }

  /**
   * Get total page views (from DailyAnalytics sum)
   */
  async getTotalPageViews(): Promise<ServiceResult<number>> {
    try {
      await connectToDatabase();
      const result = await DailyAnalytics.aggregate([
        { $group: { _id: null, total: { $sum: "$totalPageViews" } } },
      ]);
      return { success: true, data: result[0]?.total || 0 };
    } catch (error) {
      console.error("[AnalyticsService.getTotalPageViews] Error:", error);
      return { success: false, error: "Failed to count page views" };
    }
  }

  // =========================================================================
  // Legacy methods (kept for backward compat with existing dashboard/stats)
  // =========================================================================

  /**
   * Get daily stats (legacy — delegates to DailyAnalytics now)
   */
  async getDailyStats(
    days: number = 30,
  ): Promise<ServiceResult<{ date: string; hits: number }[]>> {
    try {
      await connectToDatabase();
      const startDate = getDateStringDaysAgo(days);

      const docs = await DailyAnalytics.find({ date: { $gte: startDate } })
        .sort({ date: 1 })
        .lean();

      const formattedStats = docs.map((doc) => ({
        date: doc.date,
        hits: doc.totalPageViews || 0,
      }));

      return { success: true, data: formattedStats };
    } catch (error) {
      console.error("[AnalyticsService.getDailyStats] Error:", error);
      return { success: false, error: "Failed to get daily stats" };
    }
  }

  /**
   * Get distributions (legacy — now from Visitor collection for accuracy)
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
        Visitor.aggregate([
          { $group: { _id: "$browser", value: { $sum: 1 } } },
          { $project: { name: "$_id", value: 1, _id: 0 } },
          { $sort: { value: -1 } },
          { $limit: 10 },
        ]),
        Visitor.aggregate([
          { $group: { _id: "$os", value: { $sum: 1 } } },
          { $project: { name: "$_id", value: 1, _id: 0 } },
          { $sort: { value: -1 } },
          { $limit: 10 },
        ]),
        Visitor.aggregate([
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
   * Get top paths (legacy)
   */
  async getTopPaths(
    limit: number = 10,
  ): Promise<ServiceResult<{ path: string; hits: number }[]>> {
    try {
      await connectToDatabase();
      const topPaths = await Visitor.aggregate([
        { $unwind: "$pages" },
        { $group: { _id: "$pages", hits: { $sum: 1 } } },
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
   * Get recent hits list (legacy — now returns recent visitors)
   */
  async getRecentHits(
    limit: number = 50,
    page: number = 1,
  ): Promise<
    ServiceResult<{ items: Record<string, unknown>[]; total: number }>
  > {
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

      return {
        success: true,
        data: { items: items as unknown as Record<string, unknown>[], total },
      };
    } catch (error) {
      console.error("[AnalyticsService.getRecentHits] Error:", error);
      return { success: false, error: "Failed to get recent hits" };
    }
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  private extractReferrerDomain(referrer: string): string {
    if (!referrer) return "direct";
    try {
      const url = new URL(referrer);
      return url.hostname.replace(/^www\./, "");
    } catch {
      return referrer.slice(0, 50) || "direct";
    }
  }
}

export const analyticsService = new AnalyticsService();
