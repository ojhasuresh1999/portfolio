"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  CategoryPieChart,
  CategoryBarChart,
} from "@/components/admin/dashboard-charts";

// ─── Types ──────────────────────────────────────────────────────────────────

interface VisitorOverview {
  totalUniqueVisitors: number;
  todayUniqueVisitors: number;
  weekUniqueVisitors: number;
  monthUniqueVisitors: number;
  newVisitorsToday: number;
  returningVisitorsToday: number;
  avgPagesPerVisitor: number;
  bounceRate: number;
  activeVisitors: number;
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

interface RecentVisitor {
  fingerprintHash: string;
  browser: string;
  os: string;
  device: string;
  country: string;
  pages: string[];
  totalVisits: number;
  lastSeen: string;
  firstSeen: string;
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
  recentVisitors: RecentVisitor[];
}

interface AnalyticsResponse {
  advanced: AdvancedStats;
  daily: { date: string; hits: number }[];
  distributions: {
    browser: Distribution[];
    os: Distribution[];
    device: Distribution[];
  };
  topPaths: { path: string; hits: number }[];
  totalHits: number;
}

// ─── KPI Card ───────────────────────────────────────────────────────────────

function KPICard({
  icon,
  label,
  value,
  sub,
  color,
  pulse,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  pulse?: boolean;
}) {
  return (
    <div className="bg-card-dark border border-white/5 rounded-xl p-5 shadow-xl hover:border-white/10 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} bg-opacity-15`}
        >
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        {pulse && (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
        {value}
      </div>
      <div className="text-sm text-slate-400 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

// ─── Device Icon Helper ─────────────────────────────────────────────────────

function getDeviceIcon(device: string) {
  switch (device.toLowerCase()) {
    case "mobile":
      return "smartphone";
    case "tablet":
      return "tablet_mac";
    default:
      return "computer";
  }
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [trendMode, setTrendMode] = useState<"pageViews" | "uniqueVisitors">(
    "uniqueVisitors",
  );
  const [visitorPage, setVisitorPage] = useState(1);
  const visitorsPerPage = 15;

  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ["analyticsStats"],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: boolean;
        data: AnalyticsResponse;
      }>("/admin/analytics/stats");
      return res.data;
    },
    refetchInterval: 30000, // Auto-refresh every 30s for live feel
  });

  const stats = statsResponse?.data;
  const adv = stats?.advanced;
  const overview = adv?.overview;

  // Paginate recent visitors
  const allVisitors = adv?.recentVisitors || [];
  const totalVisitorPages = Math.ceil(allVisitors.length / visitorsPerPage);
  const paginatedVisitors = allVisitors.slice(
    (visitorPage - 1) * visitorsPerPage,
    visitorPage * visitorsPerPage,
  );

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">
              query_stats
            </span>
            Advanced Analytics
          </h1>
          <p className="text-slate-400">
            Production-level insights — unique devices, not raw hits.
          </p>
        </div>
        {overview && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-green-400 text-sm font-medium">
              {overview.activeVisitors} active now
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <span className="material-symbols-outlined animate-spin mr-2">
            progress_activity
          </span>
          Loading analytics...
        </div>
      ) : (
        <>
          {/* ── KPI Grid ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KPICard
              icon="devices"
              label="Total Unique Devices"
              value={overview?.totalUniqueVisitors?.toLocaleString() || "0"}
              sub="All time"
              color="text-blue-400"
            />
            <KPICard
              icon="today"
              label="Today"
              value={overview?.todayUniqueVisitors?.toLocaleString() || "0"}
              sub={`${overview?.newVisitorsToday || 0} new · ${overview?.returningVisitorsToday || 0} returning`}
              color="text-emerald-400"
            />
            <KPICard
              icon="date_range"
              label="This Week"
              value={overview?.weekUniqueVisitors?.toLocaleString() || "0"}
              sub="Last 7 days"
              color="text-violet-400"
            />
            <KPICard
              icon="calendar_month"
              label="This Month"
              value={overview?.monthUniqueVisitors?.toLocaleString() || "0"}
              sub="Last 30 days"
              color="text-amber-400"
            />
            <KPICard
              icon="wifi_tethering"
              label="Active Now"
              value={overview?.activeVisitors || 0}
              sub="Last 5 minutes"
              color="text-green-400"
              pulse
            />
          </div>

          {/* ── Secondary KPIs ───────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              icon="description"
              label="Avg Pages / Visitor"
              value={overview?.avgPagesPerVisitor || 0}
              color="text-cyan-400"
            />
            <KPICard
              icon="exit_to_app"
              label="Bounce Rate"
              value={`${overview?.bounceRate || 0}%`}
              sub="Single-page visitors"
              color="text-rose-400"
            />
            <KPICard
              icon="person_add"
              label="New Today"
              value={overview?.newVisitorsToday || 0}
              color="text-teal-400"
            />
            <KPICard
              icon="person"
              label="Returning Today"
              value={overview?.returningVisitorsToday || 0}
              color="text-indigo-400"
            />
          </div>

          {/* ── Traffic Trend Chart ──────────────────────────────── */}
          <div className="bg-card-dark border border-white/5 rounded-xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  monitoring
                </span>
                Traffic Trend (30 Days)
              </h3>
              <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setTrendMode("uniqueVisitors")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    trendMode === "uniqueVisitors"
                      ? "bg-primary text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Unique Visitors
                </button>
                <button
                  onClick={() => setTrendMode("pageViews")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    trendMode === "pageViews"
                      ? "bg-primary text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Page Views
                </button>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={adv?.dailyTrend || []}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickMargin={10}
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <Area
                    type="monotone"
                    dataKey={trendMode}
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#colorTrend)"
                    dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                    activeDot={{
                      r: 6,
                      fill: "#fff",
                      stroke: "#3b82f6",
                      strokeWidth: 2,
                    }}
                  />
                  {trendMode === "uniqueVisitors" && (
                    <Line
                      type="monotone"
                      dataKey="newVisitors"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      strokeDasharray="5 5"
                      dot={false}
                      name="New Visitors"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Top Pages + Referrers ────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Pages */}
            <div className="bg-card-dark border border-white/5 rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  explore
                </span>
                Top Pages
                <span className="text-xs text-slate-500 font-normal ml-auto">
                  by unique visitors
                </span>
              </h3>
              <div className="space-y-3">
                {adv?.topPages?.map((item, i) => {
                  const maxVisitors = adv.topPages[0]?.uniqueVisitors || 1;
                  const barWidth = Math.max(
                    (item.uniqueVisitors / maxVisitors) * 100,
                    5,
                  );
                  return (
                    <div
                      key={item.path}
                      className="relative p-3 bg-white/5 rounded-lg border border-white/5 overflow-hidden"
                    >
                      <div
                        className="absolute inset-0 bg-blue-500/5 rounded-lg"
                        style={{ width: `${barWidth}%` }}
                      />
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-slate-500 font-mono text-xs min-w-[24px]">
                            #{i + 1}
                          </span>
                          <span className="text-white font-medium truncate text-sm">
                            {item.path}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <span className="text-xs text-slate-400">
                            {item.views} views
                          </span>
                          <span className="text-primary font-bold text-sm">
                            {item.uniqueVisitors}
                            <span className="text-xs text-slate-500 ml-1">
                              unique
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!adv?.topPages || adv.topPages.length === 0) && (
                  <p className="text-slate-500 text-sm text-center py-4">
                    No page data yet
                  </p>
                )}
              </div>
            </div>

            {/* Top Referrers */}
            <div className="bg-card-dark border border-white/5 rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">
                  link
                </span>
                Top Referrers
              </h3>
              <div className="space-y-3">
                {adv?.topReferrers?.map((ref, i) => {
                  const maxVal = adv.topReferrers[0]?.value || 1;
                  const barWidth = Math.max((ref.value / maxVal) * 100, 5);
                  return (
                    <div
                      key={ref.name}
                      className="relative p-3 bg-white/5 rounded-lg border border-white/5 overflow-hidden"
                    >
                      <div
                        className="absolute inset-0 bg-amber-500/5 rounded-lg"
                        style={{ width: `${barWidth}%` }}
                      />
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 font-mono text-xs min-w-[24px]">
                            #{i + 1}
                          </span>
                          <span className="text-white font-medium text-sm">
                            {ref.name === "direct" ? "🔗 Direct" : ref.name}
                          </span>
                        </div>
                        <span className="text-amber-400 font-bold text-sm">
                          {ref.value}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {(!adv?.topReferrers || adv.topReferrers.length === 0) && (
                  <p className="text-slate-500 text-sm text-center py-4">
                    No referrer data yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Distribution Charts ──────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CategoryPieChart
              data={adv?.distributions?.device || []}
              title="Device Distribution (Unique Visitors)"
            />
            <CategoryPieChart
              data={adv?.distributions?.browser || []}
              title="Browser Distribution"
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CategoryBarChart
              data={adv?.distributions?.os || []}
              title="OS Distribution"
            />
            <CategoryBarChart
              data={adv?.distributions?.country || []}
              title="Country Distribution"
            />
          </div>

          {/* ── Unique Visitors Log ──────────────────────────────── */}
          <div className="bg-card-dark border border-white/5 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400">
                fingerprint
              </span>
              Unique Visitor Devices
              <span className="text-xs text-slate-500 font-normal ml-2 bg-white/5 px-2 py-0.5 rounded-full">
                {allVisitors.length} devices
              </span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-black/20">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Device ID</th>
                    <th className="px-4 py-3">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">
                          devices
                        </span>
                        Device
                      </span>
                    </th>
                    <th className="px-4 py-3">Browser / OS</th>
                    <th className="px-4 py-3">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">
                          location_on
                        </span>
                        Location
                      </span>
                    </th>
                    <th className="px-4 py-3">Pages Visited</th>
                    <th className="px-4 py-3">Total Visits</th>
                    <th className="px-4 py-3">First Seen</th>
                    <th className="px-4 py-3 rounded-tr-lg">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVisitors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        No visitor data yet. Visitors will appear once someone
                        views your portfolio.
                      </td>
                    </tr>
                  ) : (
                    paginatedVisitors.map((v) => (
                      <tr
                        key={v.fingerprintHash}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        {/* Device ID */}
                        <td className="px-4 py-3">
                          <code className="text-xs bg-white/5 px-2 py-1 rounded font-mono text-violet-300">
                            {v.fingerprintHash}
                          </code>
                        </td>
                        {/* Device Type */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-slate-400">
                              {getDeviceIcon(v.device)}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                v.device === "Mobile"
                                  ? "bg-blue-500/15 text-blue-300"
                                  : v.device === "Tablet"
                                    ? "bg-purple-500/15 text-purple-300"
                                    : "bg-emerald-500/15 text-emerald-300"
                              }`}
                            >
                              {v.device}
                            </span>
                          </div>
                        </td>
                        {/* Browser / OS */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-slate-200 text-sm">
                              {v.browser}
                            </span>
                            <span className="text-xs text-slate-500">
                              {v.os}
                            </span>
                          </div>
                        </td>
                        {/* Location */}
                        <td className="px-4 py-3">
                          <span className="text-sm">
                            {v.country !== "Unknown" ? (
                              <span className="text-slate-200">
                                {v.country}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">
                                Unknown
                              </span>
                            )}
                          </span>
                        </td>
                        {/* Pages */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {v.pages.slice(0, 3).map((p) => (
                              <span
                                key={p}
                                className="text-xs bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-300"
                              >
                                {p}
                              </span>
                            ))}
                            {v.pages.length > 3 && (
                              <span className="text-xs text-slate-500">
                                +{v.pages.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Visit Count */}
                        <td className="px-4 py-3">
                          <span className="text-primary font-bold">
                            {v.totalVisits}
                          </span>
                        </td>
                        {/* First Seen */}
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                          {new Date(v.firstSeen).toLocaleDateString()}
                        </td>
                        {/* Last Active */}
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                          {formatTimeAgo(v.lastSeen)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalVisitorPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <span className="text-sm text-slate-400">
                  Page {visitorPage} of {totalVisitorPages}
                  <span className="text-slate-600 ml-2">
                    ({allVisitors.length} total devices)
                  </span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVisitorPage((p) => Math.max(1, p - 1))}
                    disabled={visitorPage === 1}
                    className="p-2 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      chevron_left
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      setVisitorPage((p) => Math.min(totalVisitorPages, p + 1))
                    }
                    disabled={visitorPage === totalVisitorPages}
                    className="p-2 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}
