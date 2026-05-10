import { notFound } from "next/navigation";
import type { ComponentPropsWithoutRef } from "react";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "@/components/mdx/CodeBlock";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { blogService } from "@/server/services/blog.service";

export const revalidate = 60; // optionally revalidate every 60 seconds

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const postRes = await blogService.getBySlug(resolvedParams.slug, true);

  if (!postRes.success || !postRes.data) {
    notFound();
  }

  const post = postRes.data;

  return (
    <>
      <Navbar />

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-20 sm:py-24 pt-28 sm:pt-32 relative z-10 font-[family-name:var(--font-mono)]">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">
              arrow_back
            </span>
            Return to Index
          </Link>
        </div>

        {/* Header Metadata */}
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 border-l-2 border-primary pl-4">
            <span className="text-primary">{post.category}</span>
            <span>{"//"}</span>
            <span>
              {post.publishedAt
                ? formatDate(post.publishedAt)
                : formatDate(post.createdAt)}
            </span>
            <span>{"//"}</span>
            <span>{post.readTime} MIN_READ</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-tight mb-6 sm:mb-8 tracking-tighter">
            {post.title}
          </h1>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-white/5 border border-white/10 text-gray-400 text-xs font-bold uppercase tracking-wider"
              >
                #{tag}
              </span>
            ))}
          </div>
        </header>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="w-full h-48 sm:h-64 md:h-[400px] relative rounded overflow-hidden border border-white/10 mb-10 sm:mb-16 shadow-[0_0_30px_rgba(0,242,255,0.05)]">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>
        )}

        {/* Markdown Content */}
        <article className="prose prose-invert prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 max-w-none text-gray-300 leading-relaxed marker:text-primary">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({
                node: _node,
                inline,
                className,
                children,
                ...props
              }: ComponentPropsWithoutRef<"code"> & {
                inline?: boolean;
                node?: unknown;
              }) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <CodeBlock
                    language={match[1]}
                    code={String(children).replace(/\n$/, "")}
                  />
                ) : (
                  <code
                    {...props}
                    className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold border border-primary/20"
                  >
                    {children}
                  </code>
                );
              },
              // Style blockquotes
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-4 py-1 italic bg-primary/5 text-gray-300 my-6">
                  {children}
                </blockquote>
              ),
              // Style headers
              h2: ({ children }) => (
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-12 mb-6 flex items-center gap-3">
                  <span className="w-1 h-6 bg-primary inline-block" />
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-10 mb-4 opacity-90 text-primary">
                  {children}
                </h3>
              ),
              // Links
              a: ({ children, href }) => (
                <a
                  href={href}
                  className="text-primary hover:text-white underline decoration-primary/50 underline-offset-4 transition-colors font-semibold shadow-[0_2px_0_rgba(0,240,255,0.2)]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </article>

        {/* Footer separator line */}
        <div className="mt-20 pt-8 border-t border-white/10 flex items-center justify-between">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">
              arrow_back
            </span>
            Index
          </Link>
          <div className="flex gap-4">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}`}
              target="_blank"
              rel="noopener"
              className="text-gray-500 hover:text-primary transition-colors"
            >
              Share on Twitter
            </a>
          </div>
        </div>
      </main>

      {/* Decorative Grid BG */}
      <div className="fixed inset-0 z-0 bg-[size:50px_50px] bg-grid-pattern opacity-[0.03] pointer-events-none" />

      <Footer />
    </>
  );
}
