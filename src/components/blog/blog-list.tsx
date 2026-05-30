"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useCallback, useEffect } from "react";
import { useInfiniteBlogPosts, type BlogPostData } from "@/hooks/queries";

interface BlogListProps {
  initialPosts: BlogPostData[];
  categoryFilter?: string;
  tagFilter?: string;
}

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function BlogList({
  initialPosts,
  categoryFilter,
  tagFilter,
}: BlogListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteBlogPosts({
    limit: 10,
    category: categoryFilter,
    tag: tagFilter,
  });

  const posts = data?.pages.flatMap((p) => p.data) ?? initialPosts;

  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: "200px",
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center border border-red-500/20 bg-red-500/5 border-dashed">
        <span className="material-symbols-outlined text-4xl text-red-500/60 mb-4">
          error
        </span>
        <p className="text-gray-400">Failed to load signals.</p>
      </div>
    );
  }

  if (!isLoading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 bg-surface-dark border-dashed">
        <span className="material-symbols-outlined text-4xl text-gray-500 mb-4">
          search_off
        </span>
        <p className="text-gray-400">No signals found matching criteria.</p>
      </div>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <article
          key={post.slug}
          className="group relative flex flex-col md:flex-row gap-5 sm:gap-8 items-stretch border border-white/5 bg-surface-dark hover:border-primary/30 p-4 sm:p-6 transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,240,255,0.05)]"
        >
          {/* Image */}
          {post.coverImage ? (
            <div className="evervault-card md:w-5/12 w-full shrink-0 relative h-48 sm:h-64 md:h-auto overflow-hidden bg-black border border-white/10 group-hover:border-primary/50 transition-colors">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 30vw"
                className="object-cover absolute inset-0 z-0 opacity-40 group-hover:opacity-100 transition-opacity duration-700 grayscale group-hover:grayscale-0"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
              />
              <div className="absolute top-0 w-full h-[2px] bg-primary shadow-[0_0_15px_#00f0ff] opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-[scan_2s_ease-in-out_infinite] z-20" />
            </div>
          ) : (
            <div className="evervault-card md:w-5/12 w-full shrink-0 relative h-48 sm:h-64 md:h-auto overflow-hidden bg-black border border-white/10 flex items-center justify-center group-hover:border-primary/50 transition-colors text-white/10">
              <span className="material-symbols-outlined text-6xl group-hover:text-primary/20 transition-colors">
                article
              </span>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 flex flex-col justify-between py-2">
            <div>
              {/* Meta */}
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase mb-4 text-gray-500">
                <span className="text-black bg-primary px-2 py-0.5 skew-x-[-10deg]">
                  <span className="skew-x-[10deg] block">{post.category}</span>
                </span>
                <span>::</span>
                <span className="text-primary">
                  {post.publishedAt
                    ? formatDate(post.publishedAt)
                    : formatDate(post.createdAt)}
                </span>
                <span>::</span>
                <span>{post.readTime} MIN</span>
              </div>

              {/* Title */}
              <h3 className="text-white text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-3 sm:mb-4 group-hover:text-primary transition-colors cursor-pointer tracking-tight">
                <Link
                  href={`/blog/${post.slug}`}
                  className="hover:underline decoration-primary/50 underline-offset-4"
                >
                  {post.title}
                </Link>
              </h3>

              {/* Excerpt */}
              <p className="text-gray-400 text-sm leading-relaxed mb-6 border-l border-white/10 pl-4 relative line-clamp-3">
                {post.excerpt}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
              <div className="flex gap-2 flex-wrap">
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] text-gray-500 group-hover:text-primary/70 transition-colors"
                  >
                    #{tag.toLowerCase().replace(/\s+/g, "-")}
                  </span>
                ))}
              </div>
              <Link
                href={`/blog/${post.slug}`}
                className="flex items-center gap-2 text-xs font-bold text-white hover:text-primary transition-colors uppercase tracking-wider group/link shrink-0"
              >
                Execute_Read{" "}
                <span className="material-symbols-outlined text-sm transition-transform group-hover/link:translate-x-1">
                  terminal
                </span>
              </Link>
            </div>
          </div>
        </article>
      ))}

      {/* Loading Skeletons for next pages */}
      {isFetchingNextPage && (
        <div className="flex flex-col gap-8">
          {[1, 2].map((i) => (
            <article
              key={`skeleton-${i}`}
              className="flex flex-col md:flex-row gap-5 sm:gap-8 items-stretch border border-white/5 bg-surface-dark p-4 sm:p-6 animate-pulse"
            >
              <div className="md:w-5/12 w-full shrink-0 h-48 sm:h-64 md:h-auto bg-white/5" />
              <div className="flex-1 flex flex-col py-2 gap-4">
                <div className="h-4 bg-white/5 w-1/4 rounded" />
                <div className="h-8 bg-white/5 w-3/4 rounded mt-2" />
                <div className="h-4 bg-white/5 w-full rounded mt-4" />
                <div className="h-4 bg-white/5 w-5/6 rounded" />
                <div className="mt-auto flex justify-between">
                  <div className="h-4 bg-white/5 w-1/3 rounded" />
                  <div className="h-4 bg-white/5 w-1/4 rounded" />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Infinite Scroll Sentinel */}
      <div ref={sentinelRef} className="py-4" />

      {/* End of Results */}
      {!hasNextPage && posts.length > 0 && !isFetchingNextPage && (
        <div className="flex justify-center items-center py-8">
          <div className="flex items-center gap-3 text-gray-600 font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest border-t border-white/5 pt-8 w-full justify-center">
            <span className="w-8 h-px bg-gray-700" />
            <span>END_OF_TRANSMISSION</span>
            <span className="w-8 h-px bg-gray-700" />
          </div>
        </div>
      )}
    </>
  );
}
