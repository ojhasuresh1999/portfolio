/**
 * Seed script for advanced analytics.
 *
 * 1. Drops old Analytics, Visitor, DailyAnalytics collections
 * 2. Seeds ~60 realistic unique visitors spread across 30 days
 * 3. Seeds DailyAnalytics rollup documents for each day
 *
 * Run: npx tsx scripts/seed-analytics.ts
 */

import mongoose from "mongoose";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";

// Load env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env");
  process.exit(1);
}

// ─── Schemas (inline to avoid path alias issues in scripts) ─────────────────

const visitorSchema = new mongoose.Schema(
  {
    fingerprintHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    totalVisits: { type: Number, default: 1 },
    pages: { type: [String], default: [] },
    browser: { type: String, default: "Unknown" },
    os: { type: String, default: "Unknown" },
    device: { type: String, default: "Desktop" },
    screenResolution: { type: String, default: "" },
    language: { type: String, default: "" },
    timezone: { type: String, default: "" },
    country: { type: String, default: "Unknown" },
    city: { type: String, default: "Unknown" },
    referrer: { type: String, default: "" },
    lastIp: { type: String, default: "" },
  },
  { timestamps: true },
);

const dailyAnalyticsSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true, index: true },
    totalPageViews: { type: Number, default: 0 },
    uniqueVisitorHashes: { type: [String], default: [] },
    newVisitors: { type: Number, default: 0 },
    returningVisitors: { type: Number, default: 0 },
    bounces: { type: Number, default: 0 },
    pageViews: { type: Map, of: Number, default: {} },
    devices: { type: Map, of: Number, default: {} },
    browsers: { type: Map, of: Number, default: {} },
    operatingSystems: { type: Map, of: Number, default: {} },
    countries: { type: Map, of: Number, default: {} },
    referrers: { type: Map, of: Number, default: {} },
  },
  { timestamps: true },
);

const analyticsSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    referrer: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    ip: { type: String, default: "" },
    browser: { type: String, default: "Unknown" },
    os: { type: String, default: "Unknown" },
    device: { type: String, default: "Unknown" },
  },
  { timestamps: true },
);

// ─── Sample Data Pools ──────────────────────────────────────────────────────

const BROWSERS = [
  "Chrome 125",
  "Chrome 124",
  "Chrome 123",
  "Firefox 126",
  "Firefox 125",
  "Safari 17",
  "Safari 18",
  "Edge 125",
  "Edge 124",
  "Brave 1_67",
  "Opera 111",
];

const OS_LIST = [
  "Windows 11",
  "Windows 10",
  "macOS 14",
  "macOS 15",
  "Ubuntu 24_04",
  "Fedora 40",
  "Android 14",
  "Android 15",
  "iOS 17",
  "iOS 18",
];

const DEVICES = ["Desktop", "Desktop", "Desktop", "Mobile", "Mobile", "Tablet"];

const COUNTRIES = [
  "India",
  "India",
  "India",
  "India",
  "United States",
  "United States",
  "Germany",
  "United Kingdom",
  "Canada",
  "Australia",
  "Japan",
  "France",
  "Brazil",
  "Netherlands",
  "Singapore",
];

const CITIES: Record<string, string[]> = {
  India: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune"],
  "United States": ["New York", "San Francisco", "Austin", "Seattle"],
  Germany: ["Berlin", "Munich"],
  "United Kingdom": ["London", "Manchester"],
  Canada: ["Toronto", "Vancouver"],
  Australia: ["Sydney", "Melbourne"],
  Japan: ["Tokyo"],
  France: ["Paris"],
  Brazil: ["São Paulo"],
  Netherlands: ["Amsterdam"],
  Singapore: ["Singapore"],
};

const PAGES = [
  "/",
  "/",
  "/",
  "/",
  "/projects",
  "/projects",
  "/blog",
  "/blog",
  "/skills",
  "/about",
  "/resume",
  "/projects/some-project",
  "/blog/some-post",
];

const REFERRERS = [
  "direct",
  "direct",
  "direct",
  "direct",
  "google_com",
  "google_com",
  "google_com",
  "github_com",
  "github_com",
  "linkedin_com",
  "twitter_com",
  "dev_to",
  "reddit_com",
  "stackoverflow_com",
];

const RESOLUTIONS = [
  "1920x1080",
  "2560x1440",
  "1366x768",
  "1440x900",
  "390x844",
  "412x915",
  "393x873", // Mobile
  "768x1024",
  "820x1180", // Tablet
];

const TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "Europe/Berlin",
  "Europe/London",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Australia/Sydney",
  "America/Sao_Paulo",
];

const LANGUAGES = [
  "en-US",
  "en-IN",
  "en-GB",
  "de-DE",
  "ja-JP",
  "fr-FR",
  "pt-BR",
  "hi-IN",
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function dateNDaysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(randInt(0, 23), randInt(0, 59), randInt(0, 59), 0);
  return d;
}

function dateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

function sanitizeMapKey(key: string): string {
  return key.replace(/\./g, "_").replace(/\$/g, "_").slice(0, 80) || "unknown";
}

// ─── Main Seed ──────────────────────────────────────────────────────────────

async function seed() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI!);
  console.log("✅ Connected\n");

  const Visitor = mongoose.model("Visitor", visitorSchema);
  const DailyAnalytics = mongoose.model("DailyAnalytics", dailyAnalyticsSchema);
  const Analytics = mongoose.model("Analytics", analyticsSchema);

  // ── Step 1: Drop old data ──────────────────────────────────────────────
  console.log("🗑️  Dropping old analytics collections...");
  await Analytics.collection
    .drop()
    .catch(() => console.log("   (Analytics collection didn't exist)"));
  await Visitor.collection
    .drop()
    .catch(() => console.log("   (Visitor collection didn't exist)"));
  await DailyAnalytics.collection
    .drop()
    .catch(() => console.log("   (DailyAnalytics collection didn't exist)"));
  console.log("✅ Old data cleared\n");

  // Recreate indexes
  await Visitor.createIndexes();
  await DailyAnalytics.createIndexes();

  // ── Step 2: Generate visitors ──────────────────────────────────────────
  const TOTAL_VISITORS = 65;
  const visitors: Array<{
    fingerprintHash: string;
    firstSeen: Date;
    lastSeen: Date;
    totalVisits: number;
    pages: string[];
    browser: string;
    os: string;
    device: string;
    screenResolution: string;
    language: string;
    timezone: string;
    country: string;
    city: string;
    referrer: string;
    lastIp: string;
  }> = [];

  console.log(`👤 Generating ${TOTAL_VISITORS} unique visitors...`);

  for (let i = 0; i < TOTAL_VISITORS; i++) {
    const fingerprint = crypto.randomBytes(32).toString("hex");
    const daysAgo = randInt(0, 29);
    const firstSeen = dateNDaysAgo(daysAgo);
    const returnVisits = Math.random() < 0.4 ? randInt(2, 8) : 1;
    const lastSeenDaysAgo = Math.max(
      0,
      daysAgo - randInt(0, Math.min(daysAgo, 5)),
    );
    const lastSeen = daysAgo === 0 ? new Date() : dateNDaysAgo(lastSeenDaysAgo);

    // Pick random pages (1-6)
    const pageCount = randInt(1, 6);
    const pages: string[] = [];
    for (let p = 0; p < pageCount; p++) {
      const page = pick(PAGES);
      if (!pages.includes(page)) pages.push(page);
    }

    const country = pick(COUNTRIES);
    const citiesForCountry = CITIES[country] || ["Unknown"];
    const device = pick(DEVICES);

    visitors.push({
      fingerprintHash: fingerprint,
      firstSeen,
      lastSeen,
      totalVisits: returnVisits,
      pages,
      browser: pick(BROWSERS),
      os:
        device === "Mobile"
          ? pick(["Android 14", "Android 15", "iOS 17", "iOS 18"])
          : device === "Tablet"
            ? pick(["iOS 17", "iOS 18", "Android 14"])
            : pick([
                "Windows 11",
                "Windows 10",
                "macOS 14",
                "macOS 15",
                "Ubuntu 24_04",
              ]),
      device,
      screenResolution:
        device === "Mobile"
          ? pick(["390x844", "412x915", "393x873"])
          : device === "Tablet"
            ? pick(["768x1024", "820x1180"])
            : pick(["1920x1080", "2560x1440", "1366x768", "1440x900"]),
      language: pick(LANGUAGES),
      timezone: pick(TIMEZONES),
      country,
      city: pick(citiesForCountry),
      referrer: pick(REFERRERS),
      lastIp: `${randInt(100, 220)}.${randInt(0, 255)}.${randInt(0, 255)}.0`,
    });
  }

  await Visitor.insertMany(visitors);
  console.log(`✅ ${visitors.length} visitors inserted\n`);

  // ── Step 3: Build DailyAnalytics from visitors ─────────────────────────
  console.log("📊 Building daily analytics rollups...");

  const dailyMap = new Map<
    string,
    {
      totalPageViews: number;
      uniqueVisitorHashes: Set<string>;
      newVisitors: number;
      returningVisitors: number;
      bounces: number;
      pageViews: Map<string, number>;
      devices: Map<string, number>;
      browsers: Map<string, number>;
      operatingSystems: Map<string, number>;
      countries: Map<string, number>;
      referrers: Map<string, number>;
    }
  >();

  // Initialize 30 days
  for (let d = 0; d < 30; d++) {
    const ds = dateString(dateNDaysAgo(d));
    dailyMap.set(ds, {
      totalPageViews: 0,
      uniqueVisitorHashes: new Set(),
      newVisitors: 0,
      returningVisitors: 0,
      bounces: 0,
      pageViews: new Map(),
      devices: new Map(),
      browsers: new Map(),
      operatingSystems: new Map(),
      countries: new Map(),
      referrers: new Map(),
    });
  }

  // Simulate page views from visitors
  for (const v of visitors) {
    // Each visitor generates page views on their first seen day + some return days
    const visitDays: string[] = [dateString(v.firstSeen)];

    // Add return visit days
    if (v.totalVisits > 1) {
      for (let rv = 1; rv < v.totalVisits; rv++) {
        const returnDaysAgo = randInt(0, 29);
        const returnDay = dateString(dateNDaysAgo(returnDaysAgo));
        if (!visitDays.includes(returnDay)) {
          visitDays.push(returnDay);
        }
      }
    }

    for (const day of visitDays) {
      const daily = dailyMap.get(day);
      if (!daily) continue;

      const isFirstDay = day === dateString(v.firstSeen);
      const isNewOnThisDay =
        isFirstDay && !daily.uniqueVisitorHashes.has(v.fingerprintHash);
      const isReturningOnThisDay =
        !isFirstDay && !daily.uniqueVisitorHashes.has(v.fingerprintHash);

      daily.uniqueVisitorHashes.add(v.fingerprintHash);

      if (isNewOnThisDay) daily.newVisitors++;
      if (isReturningOnThisDay) daily.returningVisitors++;

      // Simulate page views for this visit (1-4 pages)
      const pagesThisVisit = v.pages.slice(
        0,
        randInt(1, Math.min(4, v.pages.length)),
      );
      for (const page of pagesThisVisit) {
        daily.totalPageViews++;
        const pk = sanitizeMapKey(page);
        daily.pageViews.set(pk, (daily.pageViews.get(pk) || 0) + 1);
      }

      if (pagesThisVisit.length === 1) daily.bounces++;

      const dk = sanitizeMapKey(v.device);
      daily.devices.set(dk, (daily.devices.get(dk) || 0) + 1);

      const bk = sanitizeMapKey(v.browser);
      daily.browsers.set(bk, (daily.browsers.get(bk) || 0) + 1);

      const ok = sanitizeMapKey(v.os);
      daily.operatingSystems.set(ok, (daily.operatingSystems.get(ok) || 0) + 1);

      const ck = sanitizeMapKey(v.country);
      daily.countries.set(ck, (daily.countries.get(ck) || 0) + 1);

      const rk = sanitizeMapKey(v.referrer);
      daily.referrers.set(rk, (daily.referrers.get(rk) || 0) + 1);
    }
  }

  // Insert daily docs
  const dailyDocs = Array.from(dailyMap.entries())
    .filter(([, data]) => data.totalPageViews > 0)
    .map(([date, data]) => ({
      date,
      totalPageViews: data.totalPageViews,
      uniqueVisitorHashes: Array.from(data.uniqueVisitorHashes),
      newVisitors: data.newVisitors,
      returningVisitors: data.returningVisitors,
      bounces: data.bounces,
      pageViews: Object.fromEntries(data.pageViews),
      devices: Object.fromEntries(data.devices),
      browsers: Object.fromEntries(data.browsers),
      operatingSystems: Object.fromEntries(data.operatingSystems),
      countries: Object.fromEntries(data.countries),
      referrers: Object.fromEntries(data.referrers),
    }));

  await DailyAnalytics.insertMany(dailyDocs);
  console.log(`✅ ${dailyDocs.length} daily analytics docs inserted\n`);

  // ── Summary ────────────────────────────────────────────────────────────
  const totalPV = dailyDocs.reduce((s, d) => s + d.totalPageViews, 0);
  console.log("═══════════════════════════════════════════");
  console.log("  📈 SEED SUMMARY");
  console.log("═══════════════════════════════════════════");
  console.log(`  Unique Visitors:  ${visitors.length}`);
  console.log(`  Daily Docs:       ${dailyDocs.length}`);
  console.log(`  Total Page Views: ${totalPV}`);
  console.log(`  Old Analytics:    DROPPED ✓`);
  console.log("═══════════════════════════════════════════\n");

  await mongoose.disconnect();
  console.log("🔌 Disconnected. Done!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
