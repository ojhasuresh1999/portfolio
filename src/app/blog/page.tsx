import Link from "next/link";
import { blogService } from "@/server/services/blog.service";
import { NewsletterForm } from "@/components/blog/NewsletterForm";
import { BlogList } from "@/components/blog/blog-list";

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
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 bg-[size:50px_50px] bg-grid-pattern opacity-[0.07] pointer-events-none" />

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-[2px] z-[100] bg-gray-800">
        <div className="h-full bg-primary w-[35%] shadow-[0_0_15px_rgba(0,240,255,0.8)] animate-pulse" />
      </div>

      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 pt-28 sm:pt-32 relative z-10 font-[family-name:var(--font-mono)] overflow-hidden">
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

            <BlogList
              initialPosts={JSON.parse(JSON.stringify(posts))}
              categoryFilter={categoryFilter}
              tagFilter={tagFilter}
            />
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
                  {
                    label: "LINKEDIN_LINK",
                    href: "https://www.linkedin.com/in/suresh-ojha-416985148/",
                  },
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
    </>
  );
}
