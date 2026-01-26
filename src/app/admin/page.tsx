import Link from "next/link";

const stats = [
  { label: "Projects", value: "12", icon: "folder", color: "text-primary" },
  {
    label: "Blog Posts",
    value: "24",
    icon: "article",
    color: "text-secondary",
  },
  { label: "Skills", value: "18", icon: "code", color: "text-green-400" },
  { label: "Messages", value: "3", icon: "mail", color: "text-orange-400" },
];

const recentActivity = [
  { action: "New message received", time: "2 hours ago", icon: "mail" },
  {
    action: "Project 'API Gateway' updated",
    time: "5 hours ago",
    icon: "edit",
  },
  { action: "Blog post published", time: "1 day ago", icon: "publish" },
  { action: "Skill 'Docker' added", time: "2 days ago", icon: "add_circle" },
];

const quickActions = [
  { label: "New Project", href: "/admin/projects/new", icon: "add" },
  { label: "New Blog Post", href: "/admin/blog/new", icon: "edit_note" },
  { label: "View Messages", href: "/admin/messages", icon: "mail" },
  { label: "Site Settings", href: "/admin/settings", icon: "settings" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-white/5 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Welcome back, Admin 👋
        </h2>
        <p className="text-slate-400">
          Here&apos;s what&apos;s happening with your portfolio today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card-dark border border-white/5 rounded-xl p-6 hover:border-white/10 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className={`material-symbols-outlined text-3xl ${stat.color}`}
              >
                {stat.icon}
              </span>
              <span className="text-3xl font-bold text-white">
                {stat.value}
              </span>
            </div>
            <p className="text-slate-400 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-card-dark border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">bolt</span>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-lg hover:bg-primary/10 hover:border-primary/20 transition-all group"
              >
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">
                  {action.icon}
                </span>
                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card-dark border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">
              history
            </span>
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 bg-white/5 rounded-lg"
              >
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-lg">
                    {activity.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{activity.action}</p>
                  <p className="text-xs text-slate-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Overview */}
      <div className="bg-card-dark border border-white/5 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-green-400">
            analytics
          </span>
          Content Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Hero */}
          <Link
            href="/admin/hero"
            className="p-4 bg-white/5 border border-white/5 rounded-lg hover:border-primary/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-400">
                Hero Section
              </span>
              <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors">
                arrow_forward
              </span>
            </div>
            <p className="text-white font-bold">
              Architecting the Invisible...
            </p>
            <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              Active
            </p>
          </Link>

          {/* Projects */}
          <Link
            href="/admin/projects"
            className="p-4 bg-white/5 border border-white/5 rounded-lg hover:border-primary/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-400">
                Featured Projects
              </span>
              <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors">
                arrow_forward
              </span>
            </div>
            <p className="text-white font-bold">2 Featured / 12 Total</p>
            <p className="text-xs text-slate-500 mt-2">Last updated 5h ago</p>
          </Link>

          {/* Blog */}
          <Link
            href="/admin/blog"
            className="p-4 bg-white/5 border border-white/5 rounded-lg hover:border-primary/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-400">
                Blog Posts
              </span>
              <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors">
                arrow_forward
              </span>
            </div>
            <p className="text-white font-bold">24 Published / 3 Drafts</p>
            <p className="text-xs text-slate-500 mt-2">Last published 1d ago</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
