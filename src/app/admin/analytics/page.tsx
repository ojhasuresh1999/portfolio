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
} from "recharts";
import {
  CategoryPieChart,
  CategoryBarChart,
} from "@/components/admin/dashboard-charts";
interface AnalyticsStatItem {
  name: string;
  value: number;
}

interface AnalyticsStats {
  daily: { date: string; hits: number }[];
  distributions: {
    browser: AnalyticsStatItem[];
    os: AnalyticsStatItem[];
    device: AnalyticsStatItem[];
  };
  topPaths: { path: string; hits: number }[];
  totalHits: number;
}

interface AnalyticsLog {
  _id: string;
  path: string;
  referrer: string;
  userAgent: string;
  ip: string;
  browser: string;
  os: string;
  device: string;
  createdAt: string;
}

export default function AnalyticsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: statsResponse, isLoading: isLoadingStats } = useQuery({
    queryKey: ["analyticsStats"],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: boolean;
        data: AnalyticsStats;
      }>("/admin/analytics/stats");
      return res.data;
    },
  });

  const { data: logsResponse, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["analyticsLogs", page],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: boolean;
        data: { items: AnalyticsLog[]; total: number };
      }>(`/admin/analytics/logs?page=${page}&limit=${limit}`);
      return res.data;
    },
  });

  const stats = statsResponse?.data;
  const logs = logsResponse?.data?.items || [];
  const totalLogs = logsResponse?.data?.total || 0;
  const totalPages = Math.ceil(totalLogs / limit);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-slate-400">
          Advanced production-level insights into your portfolio&apos;s traffic.
        </p>
      </div>

      {/* Traffic Chart */}
      <div className="bg-card-dark border border-white/5 rounded-xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            monitoring
          </span>
          Page Views (Last 30 Days)
        </h3>
        <div className="h-80 w-full">
          {isLoadingStats ? (
            <div className="flex h-full items-center justify-center text-slate-400">
              Loading chart...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.daily || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="date"
                  stroke="#888"
                  fontSize={12}
                  tickMargin={10}
                />
                <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="hits"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                  activeDot={{
                    r: 6,
                    fill: "#fff",
                    stroke: "#3b82f6",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Paths and Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Paths */}
        <div className="bg-card-dark border border-white/5 rounded-xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">
              explore
            </span>
            Top Pages
          </h3>
          <div className="space-y-4">
            {stats?.topPaths?.map((item, index) => (
              <div
                key={item.path}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-slate-500 font-mono text-sm">
                    #{index + 1}
                  </span>
                  <span className="text-white font-medium truncate">
                    {item.path}
                  </span>
                </div>
                <span className="text-primary font-bold">{item.hits}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Distributions */}
        <div className="bg-card-dark border border-white/5 rounded-xl p-6 shadow-xl flex flex-col gap-6">
          <div className="h-64">
            <CategoryPieChart
              data={stats?.distributions?.browser || []}
              title="Browser Distribution"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-auto lg:h-96">
        <CategoryBarChart
          data={stats?.distributions?.os || []}
          title="OS Distribution"
        />
        <CategoryBarChart
          data={stats?.distributions?.device || []}
          title="Device Distribution"
        />
      </div>

      {/* Detailed Logs */}
      <div className="bg-card-dark border border-white/5 rounded-xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-green-400">
            list_alt
          </span>
          Recent Hits Log
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-black/20">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Path</th>
                <th className="px-4 py-3">Browser/OS</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Referrer</th>
                <th className="px-4 py-3 rounded-tr-lg">Time</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingLogs ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No hits recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log: AnalyticsLog) => (
                  <tr
                    key={log._id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-white truncate max-w-[200px]">
                      {log.path}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-slate-200">{log.browser}</span>
                        <span className="text-xs text-slate-500">
                          {log.os} • {log.device}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {log.ip || "Unknown"}
                    </td>
                    <td className="px-4 py-3 truncate max-w-[200px] text-xs text-slate-400">
                      {log.referrer || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <span className="text-sm text-slate-400">
              Showing page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-sm">
                  chevron_left
                </span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
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
    </div>
  );
}
