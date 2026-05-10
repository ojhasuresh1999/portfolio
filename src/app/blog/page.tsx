import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { blogService } from "@/server/services/blog.service";
import { NewsletterForm } from "@/components/blog/NewsletterForm";

export const revalidate = 60; // 60s cache revalidation

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

// ── Page Component ─────────────────────────────
export default async function BlogPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  // Parse filters from URL
  const page = parseInt(searchParams.page as string) || 1;
  const categoryFilter = searchParams.category as string | undefined;
  const tagFilter = searchParams.tag as string | undefined;

  // Fetch concurrently
  const [postsRes, categoriesRes, tagsRes] = await Promise.all([
    blogService.getPublished({
      page,
      limit: 10,
      category: categoryFilter,
      tag: tagFilter,
    }),
    blogService.getCategories(),
    blogService.getTags(),
  ]);

  const posts = postsRes.success && postsRes.data ? postsRes.data.items : [];
  const total = postsRes.success && postsRes.data ? postsRes.data.total : 0;
  const totalPages = Math.ceil(total / 10);

  const categoryStats =
    categoriesRes.success && categoriesRes.data ? categoriesRes.data : [];
  const dynamicTags = tagsRes.success && tagsRes.data ? tagsRes.data : [];

  return (
    <>
      <Navbar />

      {/* Background Grid */}
      <div className="fixed inset-0 z-0 bg-[size:50px_50px] bg-grid-pattern opacity-[0.07] pointer-events-none" />

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-[2px] z-[100] bg-gray-800">
        <div className="h-full bg-primary w-[35%] shadow-[0_0_15px_rgba(0,240,255,0.8)] animate-pulse" />
      </div>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 pt-28 sm:pt-32 relative z-10 font-[family-name:var(--font-mono)]">
        {/* Header */}
        <div className="mb-12 sm:mb-24 relative">
          <div className="absolute -left-20 top-0 text-[10rem] font-black text-white/[0.02] select-none pointer-events-none leading-none rotate-90 origin-left hidden md:block">
            INDEX
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
              <span className="text-primary text-xs uppercase tracking-[0.2em]">
                Incoming Transmission
              </span>
            </div>
            <h1 className="text-white text-3xl xs:text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter leading-none">
              ENGINEERING
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-gray-600">
                CHRONICLES_
              </span>
            </h1>
          </div>

          <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed font-light border-l-2 border-primary/50 pl-4 sm:pl-6 ml-0 sm:ml-2">
            Decrypting architectural patterns, systems development, and
            engineering anomalies via distributed technical logs.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16">
          {/* Articles */}
          <div className="lg:col-span-8 flex flex-col gap-8 sm:gap-12">
            {/* Filter Tabs */}
            <div className="border-b border-white/10 mb-4 sticky top-24 z-40 bg-obsidian/95 backdrop-blur py-4">
              <div className="flex gap-2 overflow-x-auto no-scrollbar items-center pb-2">
                <Link
                  href="/blog"
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider skew-x-[-10deg] transition-all ${!categoryFilter ? "text-black bg-primary" : "text-gray-400 hover:text-white border border-transparent hover:border-white/20"}`}
                >
                  <span className="skew-x-[10deg] block">All_Logs</span>
                </Link>
                {categoryStats.map((cat) => (
                  <Link
                    key={cat.category}
                    href={`/blog?category=${encodeURIComponent(cat.category)}`}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider skew-x-[-10deg] transition-all ${categoryFilter === cat.category ? "text-black bg-primary" : "text-gray-400 hover:text-white border border-transparent hover:border-white/20"}`}
                  >
                    <span className="skew-x-[10deg] block">
                      {cat.category}{" "}
                      <span className="opacity-50 text-[10px]">
                        ({cat.count})
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Blog Posts */}
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 bg-surface-dark border-dashed">
                <span className="material-symbols-outlined text-4xl text-gray-500 mb-4">
                  search_off
                </span>
                <p className="text-gray-400">
                  No signals found matching criteria.
                </p>
              </div>
            ) : (
              posts.map((post) => (
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
                          <span className="skew-x-[10deg] block">
                            {post.category}
                          </span>
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
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 py-12">
                <Link
                  href={`/blog?page=${Math.max(1, page - 1)}${categoryFilter ? `&category=${encodeURIComponent(categoryFilter)}` : ""}${tagFilter ? `&tag=${encodeURIComponent(tagFilter)}` : ""}`}
                  className={`size-10 flex items-center justify-center border border-white/10 transition-all ${page === 1 ? "opacity-30 pointer-events-none text-gray-600" : "text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5"}`}
                >
                  <span className="material-symbols-outlined">
                    chevron_left
                  </span>
                </Link>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <Link
                        key={p}
                        href={`/blog?page=${p}${categoryFilter ? `&category=${encodeURIComponent(categoryFilter)}` : ""}${tagFilter ? `&tag=${encodeURIComponent(tagFilter)}` : ""}`}
                        className={`w-10 h-10 flex items-center justify-center ${p === page ? "bg-primary text-black font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]" : "border border-white/10 text-gray-400 hover:border-white/40 transition-colors"}`}
                      >
                        {p}
                      </Link>
                    ),
                  )}
                </div>
                <Link
                  href={`/blog?page=${Math.min(totalPages, page + 1)}${categoryFilter ? `&category=${encodeURIComponent(categoryFilter)}` : ""}${tagFilter ? `&tag=${encodeURIComponent(tagFilter)}` : ""}`}
                  className={`size-10 flex items-center justify-center border border-white/10 transition-all ${page === totalPages ? "opacity-30 pointer-events-none text-gray-600" : "text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5"}`}
                >
                  <span className="material-symbols-outlined">
                    chevron_right
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 flex flex-col gap-6 font-mono">
            {/* Newsletter */}
            <div className="border border-white/10 bg-[#06080a] p-1 relative group">
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#00f0ff]" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#00f0ff]" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#00f0ff]" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#00f0ff]" />

              <div className="relative z-10 p-5 bg-transparent h-full">
                <div className="flex items-center gap-3 mb-5">
                  <span className="material-symbols-outlined text-[#00f0ff] mb-1">
                    sensors
                  </span>
                  <h4 className="text-white font-bold tracking-widest uppercase">
                    NET_INSIGHTS
                  </h4>
                </div>
                <div className="text-gray-400 mb-6 text-xs border-l-[3px] border-white/5 pl-4 leading-relaxed font-mono">
                  <div>{"// Join the encrypted channel."}</div>
                  <div>{"// Weekly deep-dives."}</div>
                  <div>{"// No noise."}</div>
                </div>
                <NewsletterForm />
              </div>
            </div>

            {/* Tags */}
            <div className="border border-white/10 bg-[#06080a] p-6 relative">
              <h4 className="text-white font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest">
                <span className="w-1 h-3.5 bg-[#00f0ff]" />
                SYSTEM_TAGS
              </h4>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/blog`}
                  className={`bg-black border transition-colors px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider ${!tagFilter ? "border-[#00f0ff] text-[#00f0ff]" : "border-white/10 text-gray-500 hover:border-white/30 hover:text-white"}`}
                >
                  ALL
                </Link>
                {dynamicTags.map((t) => (
                  <Link
                    key={t.tag}
                    href={`/blog?tag=${encodeURIComponent(t.tag)}`}
                    className={`bg-black border transition-colors px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider ${tagFilter === t.tag ? "border-[#00f0ff] text-[#00f0ff]" : "border-white/10 text-gray-500 hover:border-white/30 hover:text-white"}`}
                  >
                    {t.tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="border border-white/10 bg-[#06080a] p-6 relative">
              <h4 className="text-[#00f0ff] font-bold font-mono mb-6 bg-white/5 inline-flex p-1 px-2 text-xs uppercase tracking-widest border-l-2 border-[#00f0ff]">
                HANDSHAKE
              </h4>
              <div className="flex flex-col gap-4 font-mono text-xs">
                {[
                  {
                    label: "GITHUB_REPO",
                    href: "https://github.com/ojhasuresh1999",
                  },
                  { label: "LINKEDIN_LINK", href: "/" },
                  { label: "RSS_FEED", href: "/" },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <span className="text-gray-500">::</span> {link.label}
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}
