"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface BlogPost {
  _id: string; // Changed from id to _id
  title: string;
  slug: string;
  category: string;
  publishedAt: Date | string;
}

interface SystemLogsSectionProps {
  posts?: BlogPost[];
}

const defaultPosts: BlogPost[] = [
  {
    _id: "1",
    title: "Optimizing SQL Queries for Large Datasets",
    slug: "optimizing-sql-queries",
    category: "Query Optimization",
    publishedAt: "2023-10-24",
  },
  {
    _id: "2",
    title: "Mastering Node.js Streams and Pipelines",
    slug: "mastering-nodejs-streams",
    category: "Stream API",
    publishedAt: "2023-09-12",
  },
];

export function SystemLogsSection({
  posts: initialPosts,
}: SystemLogsSectionProps) {
  const { data: apiPosts } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: BlogPost[];
      }>("/blog?limit=2");
      return response.data.data.map((p: BlogPost) => ({
        ...p,
        // Ensure publishedAt is handled correctly
      })) as BlogPost[];
    },
    initialData: initialPosts,
  });

  const displayPosts =
    apiPosts && apiPosts.length > 0 ? apiPosts : defaultPosts;

  return (
    <section className="mt-32 mb-20">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-10">
        <div className="flex items-center gap-4">
          <span className="flex items-center justify-center size-8 rounded bg-white/5 text-slate-300 border border-white/10 font-[family-name:var(--font-mono)] text-xs">
            03
          </span>
          <h2 className="text-2xl font-bold text-white">System Logs</h2>
        </div>
        <Link
          href="/blog"
          className="text-xs font-[family-name:var(--font-mono)] text-primary hover:text-white transition-colors flex items-center gap-2 border-b border-primary/30 pb-1"
        >
          VIEW_ALL_LOGS{" "}
          <span className="material-symbols-outlined text-sm">
            arrow_forward
          </span>
        </Link>
      </div>

      {/* Blog Posts */}
      <div className="space-y-4">
        {displayPosts.map((post) => (
          <BlogPostPreview key={post._id} post={post} />
        ))}
      </div>
    </section>
  );
}

function BlogPostPreview({ post }: { post: BlogPost }) {
  const date = new Date(post.publishedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`/blog/${post.slug}`} className="block group">
      <div className="bg-white/[0.02] border border-white/5 p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between transition-all hover:bg-white/5 hover:border-primary/30 hover:translate-x-2">
        <div className="flex flex-col gap-2">
          {/* Meta */}
          <div className="flex items-center gap-3 text-[10px] font-[family-name:var(--font-mono)] text-slate-500 uppercase tracking-widest">
            <span className="text-primary">{date}</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span>{post.category}</span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
            {post.title}
          </h3>
        </div>

        {/* Arrow */}
        <div className="mt-4 md:mt-0 opacity-50 group-hover:opacity-100 transition-all duration-300">
          <span className="material-symbols-outlined text-primary -rotate-45 group-hover:rotate-0 transition-transform">
            arrow_forward
          </span>
        </div>
      </div>
    </Link>
  );
}
