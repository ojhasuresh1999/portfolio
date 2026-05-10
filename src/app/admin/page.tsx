"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  CategoryPieChart,
  CategoryBarChart,
} from "@/components/admin/dashboard-charts";
import { motion } from "framer-motion";

interface DashboardStats {
  counts: {
    projects: number;
    blogs: number;
    skills: number;
    messages: number;
    subscribers: number;
    hits: number;
  };
  distributions: {
    blogCategories: { name: string; value: number }[];
    skillCategories: { name: string; value: number }[];
  };
  recentActivity: {
    id: string;
    action: string;
    time: string;
    icon: string;
    type: string;
  }[];
}

const quickActions = [
  { label: "New Project", href: "/admin/projects/new", icon: "add" },
  { label: "New Blog Post", href: "/admin/blog/new", icon: "edit_note" },
  { label: "View Messages", href: "/admin/chat", icon: "mail" },
  { label: "Site Settings", href: "/admin/settings", icon: "settings" },
];

export default function AdminDashboard() {
  const {
    data: statsResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: boolean;
        data: DashboardStats;
      }>("/admin/dashboard/stats");
      return res.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const statsData = statsResponse?.data;

  // Format date relative to now
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const statCards = [
    {
      label: "Projects",
      value: statsData?.counts.projects ?? 0,
      icon: "folder",
      color: "text-primary",
      border: "border-primary/20",
      bg: "bg-primary/5",
    },
    {
      label: "Blog Posts",
      value: statsData?.counts.blogs ?? 0,
      icon: "article",
      color: "text-secondary",
      border: "border-secondary/20",
      bg: "bg-secondary/5",
    },
    {
      label: "Skills",
      value: statsData?.counts.skills ?? 0,
      icon: "code",
      color: "text-green-400",
      border: "border-green-400/20",
      bg: "bg-green-400/5",
    },
    {
      label: "Subscribers",
      value: statsData?.counts.subscribers ?? 0,
      icon: "group",
      color: "text-purple-400",
      border: "border-purple-400/20",
      bg: "bg-purple-400/5",
    },
    {
      label: "Messages",
      value: statsData?.counts.messages ?? 0,
      icon: "mail",
      color: "text-orange-400",
      border: "border-orange-400/20",
      bg: "bg-orange-400/5",
    },
    {
      label: "Total Hits",
      value: statsData?.counts.hits ?? 0,
      icon: "monitoring",
      color: "text-blue-400",
      border: "border-blue-400/20",
      bg: "bg-blue-400/5",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">
            progress_activity
          </span>
          <p className="text-slate-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <span className="material-symbols-outlined text-4xl text-red-500 mb-2">
            error
          </span>
          <h3 className="text-white font-bold mb-1">Failed to load data</h3>
          <p className="text-red-400 text-sm">
            Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/10 via-secondary/10 to-purple-500/10 border border-white/10 rounded-2xl p-8 relative overflow-hidden backdrop-blur-md"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Welcome back, Admin 👋
          </h2>
          <p className="text-slate-400 text-lg">
            Here&apos;s what&apos;s happening with your portfolio today.
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className={`border rounded-xl p-6 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm ${stat.bg} ${stat.border} shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-black/20`}>
                <span
                  className={`material-symbols-outlined text-2xl ${stat.color}`}
                >
                  {stat.icon}
                </span>
              </div>
              <span className="text-3xl font-bold text-white drop-shadow-md">
                {stat.value}
              </span>
            </div>
            <p className="text-slate-300 text-sm font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-auto lg:h-96"
      >
        <CategoryPieChart
          data={statsData?.distributions.blogCategories || []}
          title="Blog Categories"
        />
        <CategoryBarChart
          data={statsData?.distributions.skillCategories || []}
          title="Skill Distribution"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* Quick Actions */}
        <div className="bg-card-dark border border-white/5 rounded-xl p-6 backdrop-blur-sm shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">bolt</span>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-primary/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all"
              >
                <div className="bg-black/20 p-2 rounded-lg">
                  <span className="material-symbols-outlined text-slate-400 text-xl transition-colors">
                    {action.icon}
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-200 transition-colors">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card-dark border border-white/5 rounded-xl p-6 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">
                history
              </span>
              Recent Activity
            </h3>
            <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
              Live Feed
            </span>
          </div>
          <div className="space-y-4">
            {statsData?.recentActivity &&
            statsData.recentActivity.length > 0 ? (
              statsData.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="mt-1 size-10 min-w-[40px] rounded-full bg-black/20 border border-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-300 text-lg">
                      {activity.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {activity.action}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatTimeAgo(activity.time)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                No recent activity found.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
