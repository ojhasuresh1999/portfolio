"use client";

import { useState } from "react";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

const mockPosts: BlogPost[] = [
  {
    id: "1",
    title: "Optimizing Node.js Event Loop Cycles",
    slug: "optimizing-nodejs-event-loop",
    category: "Performance",
    isPublished: true,
    publishedAt: "Oct 24, 2023",
    updatedAt: "2 days ago",
  },
  {
    id: "2",
    title: "Scaling PostgreSQL for 1M+ Users",
    slug: "scaling-postgresql",
    category: "Database",
    isPublished: true,
    publishedAt: "Oct 12, 2023",
    updatedAt: "1 week ago",
  },
  {
    id: "3",
    title: "Building Resilient Microservices",
    slug: "resilient-microservices",
    category: "Architecture",
    isPublished: false,
    publishedAt: null,
    updatedAt: "3 hours ago",
  },
];

export default function AdminBlogPage() {
  const [posts] = useState<BlogPost[]>(mockPosts);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Blog Posts</h2>
          <p className="text-slate-400 text-sm">
            Manage your engineering chronicles
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined">edit_note</span>
          New Post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card-dark border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Published</span>
            <span className="text-2xl font-bold text-green-400">
              {posts.filter((p) => p.isPublished).length}
            </span>
          </div>
        </div>
        <div className="bg-card-dark border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Drafts</span>
            <span className="text-2xl font-bold text-yellow-400">
              {posts.filter((p) => !p.isPublished).length}
            </span>
          </div>
        </div>
        <div className="bg-card-dark border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total</span>
            <span className="text-2xl font-bold text-white">
              {posts.length}
            </span>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-card-dark border border-white/5 rounded-xl overflow-hidden hover:border-primary/30 transition-all group"
          >
            {/* Image Placeholder */}
            <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-white/10">
                  article
                </span>
              </div>
              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                <span
                  className={`px-2 py-1 text-xs font-bold rounded ${
                    post.isPublished
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  }`}
                >
                  {post.isPublished ? "Published" : "Draft"}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <span className="text-xs text-primary font-bold uppercase tracking-wider">
                {post.category}
              </span>
              <h3 className="text-white font-bold mt-1 group-hover:text-primary transition-colors line-clamp-2">
                {post.title}
              </h3>
              <p className="text-xs text-slate-500 mt-2">
                {post.isPublished
                  ? `Published ${post.publishedAt}`
                  : `Updated ${post.updatedAt}`}
              </p>
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 flex items-center justify-between">
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                  <span className="material-symbols-outlined text-lg">
                    edit
                  </span>
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                  <span className="material-symbols-outlined text-lg">
                    visibility
                  </span>
                </button>
              </div>
              <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-slate-400 hover:text-red-400">
                <span className="material-symbols-outlined text-lg">
                  delete
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
