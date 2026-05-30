"use client";

import Link from "next/link";
import { useBlogPosts, type BlogPostData } from "@/hooks/queries";

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  category: string;
  publishedAt: Date | string;
}

interface SystemLogsSectionProps {
  posts?: BlogPost[];
}

export function SystemLogsSection({
  posts: initialPosts,
}: SystemLogsSectionProps) {
  const { data: apiPosts, isLoading } = useBlogPosts(
    { limit: 100, featured: true },
    {
      initialData: initialPosts?.length
        ? (initialPosts as BlogPostData[])
        : undefined,
    },
  );

  const displayPosts: BlogPost[] =
    apiPosts && apiPosts.length > 0
      ? apiPosts.map((p) => ({
          _id: p._id,
          title: p.title,
          slug: p.slug,
          category: p.category,
          publishedAt: p.publishedAt || p.createdAt,
        }))
      : (initialPosts ?? []).map((p) => ({
          _id: p._id,
          title: p.title,
          slug: p.slug,
          category: p.category,
          publishedAt: p.publishedAt,
        }));

  return (
    <section className="mt-20 sm:mt-32 mb-16 sm:mb-20">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-6 sm:mb-10">
        <div className="flex items-center gap-4">
          <span className="flex items-center justify-center size-8 rounded bg-white/5 text-slate-300 border border-white/10 font-[family-name:var(--font-mono)] text-xs">
            03
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            System Logs
          </h2>
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

      {/* Loading State */}
      {isLoading && displayPosts.length === 0 && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white/[0.02] border border-white/5 p-4 sm:p-6 rounded-xl animate-pulse"
            >
              <div className="h-3 bg-white/5 rounded w-1/4 mb-3" />
              <div className="h-5 bg-white/5 rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && displayPosts.length === 0 && (
        <div className="p-8 text-center border border-white/5 bg-white/[0.02] rounded-xl">
          <span className="material-symbols-outlined text-3xl text-gray-600 mb-3 block">
            article
          </span>
          <p className="text-gray-400 font-[family-name:var(--font-mono)] text-sm">
            [NO_PUBLISHED_LOGS_YET]
          </p>
        </div>
      )}

      {/* Blog Posts */}
      {displayPosts.length > 0 && (
        <div className="space-y-4">
          {displayPosts.map((post) => (
            <BlogPostPreview key={post._id} post={post} />
          ))}
        </div>
      )}
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
      <div className="bg-white/[0.02] border border-white/5 p-4 sm:p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between transition-all hover:bg-white/5 hover:border-primary/30 hover:translate-x-2">
        <div className="flex flex-col gap-2">
          {/* Meta */}
          <div className="flex items-center gap-3 text-[10px] font-[family-name:var(--font-mono)] text-slate-500 uppercase tracking-widest">
            <span className="text-primary">{date}</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span>{post.category}</span>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-primary transition-colors">
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
