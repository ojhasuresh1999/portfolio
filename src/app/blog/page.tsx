import Link from "next/link";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";

const blogPosts = [
  {
    id: "1",
    title: "Optimizing Node.js Event Loop Cycles",
    slug: "optimizing-nodejs-event-loop",
    excerpt: [
      "> A deep dive into the libuv thread pool.",
      "> Avoid blocking the event loop.",
      "> Profiling tools for heavy CPU tasks.",
    ],
    category: "Performance",
    tags: ["#nodejs", "#libuv"],
    date: "2023.10.24",
    readTime: "8_MIN_READ",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600",
  },
  {
    id: "2",
    title: "Scaling PostgreSQL for 1M+ Users",
    slug: "scaling-postgresql",
    excerpt: [
      "> Connection pooling with PgBouncer.",
      "> Read replicas & partitioning strategies.",
      "> Maintaining sub-100ms latency.",
    ],
    category: "Database",
    tags: ["#sql", "#scaling"],
    date: "2023.10.12",
    readTime: "12_MIN_READ",
    image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600",
  },
  {
    id: "3",
    title: "Microservices Auth Protocols with JWT",
    slug: "microservices-auth-jwt",
    excerpt: [
      "> Securing distributed systems.",
      "> Centralized vs Decentralized validation.",
      "> Token rotation policies & security.",
    ],
    category: "Security",
    tags: ["#security", "#jwt"],
    date: "2023.09.28",
    readTime: "10_MIN_READ",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600",
  },
];

const systemTags = ["#nodejs", "#k8s", "#docker", "#sql", "#rest", "#graphql"];

export default function BlogPage() {
  return (
    <>
      <Navbar />

      {/* Background Grid */}
      <div className="fixed inset-0 z-0 bg-[size:50px_50px] bg-grid-pattern opacity-[0.07] pointer-events-none" />

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-[2px] z-[100] bg-gray-800">
        <div className="h-full bg-primary w-[35%] shadow-[0_0_15px_rgba(0,240,255,0.8)] animate-pulse" />
      </div>

      <main className="max-w-7xl mx-auto w-full px-6 py-16 pt-32 relative z-10">
        {/* Header */}
        <div className="mb-24 relative">
          <div className="absolute -left-20 top-0 text-[10rem] font-black text-white/[0.02] select-none pointer-events-none font-[family-name:var(--font-mono)] leading-none rotate-90 origin-left">
            INDEX
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
              <span className="text-primary font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em]">
                Incoming Transmission
              </span>
            </div>
            <h1 className="text-white text-5xl md:text-7xl font-bold tracking-tighter leading-none">
              ENGINEERING
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-gray-600">
                CHRONICLES_
              </span>
            </h1>
          </div>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed font-light border-l-2 border-primary/50 pl-6 ml-2">
            Decrypting{" "}
            <span className="text-white font-[family-name:var(--font-mono)]">
              Node.js
            </span>{" "}
            internals, architectural patterns, and distributed system anomalies.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Articles */}
          <div className="lg:col-span-8 flex flex-col gap-12">
            {/* Filter Tabs */}
            <div className="border-b border-white/10 mb-4 sticky top-24 z-40 bg-obsidian/95 backdrop-blur py-4">
              <div className="flex gap-2 overflow-x-auto no-scrollbar items-center pb-2">
                {[
                  "All_Logs",
                  "Node.js",
                  "Databases",
                  "Architecture",
                  "Security",
                ].map((tab, i) => (
                  <button
                    key={tab}
                    className={`px-4 py-2 text-xs font-[family-name:var(--font-mono)] font-${i === 0 ? "bold text-black bg-primary" : "medium text-gray-400 hover:text-white border border-transparent hover:border-white/20"} uppercase tracking-wider skew-x-[-10deg] transition-all`}
                  >
                    <span className="skew-x-[10deg] block">{tab}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Blog Posts */}
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="group relative flex flex-col md:flex-row gap-8 items-stretch border border-white/5 bg-surface-dark hover:border-primary/30 p-6 transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,240,255,0.05)]"
              >
                {/* Image */}
                <div className="evervault-card md:w-5/12 w-full shrink-0 relative h-64 md:h-auto overflow-hidden bg-black border border-white/10 group-hover:border-primary/50 transition-colors">
                  <div
                    className="absolute inset-0 z-0 opacity-40 group-hover:opacity-100 transition-opacity duration-700 bg-cover bg-center grayscale group-hover:grayscale-0"
                    style={{ backgroundImage: `url('${post.image}')` }}
                  />
                  <div className="absolute top-0 w-full h-[2px] bg-primary shadow-[0_0_15px_#00f0ff] opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-[scan_2s_ease-in-out_infinite] z-20" />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between py-2">
                  <div>
                    {/* Meta */}
                    <div className="flex items-center gap-3 text-[10px] font-bold font-[family-name:var(--font-mono)] uppercase mb-4 text-gray-500">
                      <span className="text-black bg-primary px-2 py-0.5 skew-x-[-10deg]">
                        <span className="skew-x-[10deg] block">
                          {post.category}
                        </span>
                      </span>
                      <span>::</span>
                      <span className="text-primary">{post.date}</span>
                      <span>::</span>
                      <span>{post.readTime}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-white text-2xl md:text-3xl font-bold font-[family-name:var(--font-mono)] leading-tight mb-4 group-hover:text-primary transition-colors cursor-pointer tracking-tight">
                      {post.title.split(" ").slice(0, 3).join(" ")}
                      <br />
                      {post.title.split(" ").slice(3).join(" ")}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-gray-400 text-sm leading-relaxed mb-6 font-[family-name:var(--font-mono)] border-l border-white/10 pl-4">
                      {post.excerpt.map((line, i) => (
                        <span key={i}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                    <div className="flex gap-3">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-[family-name:var(--font-mono)] text-gray-500 group-hover:text-primary/70 transition-colors"
                        >
                          [{tag}]
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="flex items-center gap-2 text-xs font-bold font-[family-name:var(--font-mono)] text-white hover:text-primary transition-colors uppercase tracking-wider group/link"
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

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4 py-12 font-[family-name:var(--font-mono)]">
              <button className="size-10 flex items-center justify-center border border-white/10 text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 flex items-center justify-center bg-primary text-black font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                  1
                </button>
                <button className="w-10 h-10 flex items-center justify-center border border-white/10 text-gray-400 hover:border-white/40 transition-colors">
                  2
                </button>
                <button className="w-10 h-10 flex items-center justify-center border border-white/10 text-gray-400 hover:border-white/40 transition-colors">
                  3
                </button>
              </div>
              <button className="size-10 flex items-center justify-center border border-white/10 text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 flex flex-col gap-10">
            {/* Newsletter */}
            <div className="border border-primary/30 bg-surface-dark p-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5" />
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-primary" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary" />

              <div className="relative z-10 p-6 bg-obsidian/80 backdrop-blur-sm h-full">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-primary text-2xl animate-pulse">
                    broadcast_on_personal
                  </span>
                  <h4 className="text-lg font-bold font-[family-name:var(--font-mono)] text-white tracking-wider">
                    NET_INSIGHTS
                  </h4>
                </div>
                <p className="text-gray-400 mb-6 text-sm font-[family-name:var(--font-mono)] border-l-2 border-gray-800 pl-3">
                  // Join the encrypted channel.
                  <br />
                  // Weekly deep-dives.
                  <br />
                  // No noise.
                </p>
                <div className="flex flex-col gap-4">
                  <input
                    type="email"
                    placeholder="user@domain.sys"
                    className="bg-black border border-white/20 text-primary font-[family-name:var(--font-mono)] placeholder:text-gray-700 focus:ring-1 focus:ring-primary focus:border-primary py-3 px-4 text-xs w-full transition-all"
                  />
                  <button className="bg-white/5 border border-primary/50 text-primary font-bold py-3 text-xs font-[family-name:var(--font-mono)] hover:bg-primary hover:text-black transition-all uppercase tracking-widest relative overflow-hidden group/btn">
                    <span className="relative z-10">Initialize_Sub</span>
                    <div className="absolute inset-0 bg-primary translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 z-0" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="border border-white/10 bg-surface-dark p-8 relative">
              <h4 className="text-white font-bold font-[family-name:var(--font-mono)] mb-6 flex items-center gap-2 text-xs uppercase tracking-widest">
                <span className="w-1 h-4 bg-primary" />
                System_Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {systemTags.map((tag) => (
                  <a
                    key={tag}
                    href="#"
                    className="font-[family-name:var(--font-mono)] bg-black border border-white/10 hover:border-primary text-gray-400 hover:text-primary px-3 py-1.5 text-[10px] uppercase tracking-wider transition-all hover:shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                  >
                    {tag}
                  </a>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="border border-white/10 bg-surface-dark p-8 relative">
              <h4 className="text-white font-bold font-[family-name:var(--font-mono)] mb-6 flex items-center gap-2 text-xs uppercase tracking-widest">
                <span className="w-1 h-4 bg-primary" />
                Handshake
              </h4>
              <div className="flex flex-col gap-1">
                {[
                  { label: "GitHub_Repo", href: "https://github.com" },
                  { label: "LinkedIn_Link", href: "https://linkedin.com" },
                  { label: "RSS_Feed", href: "/rss" },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="flex items-center gap-4 p-3 -mx-3 border border-transparent hover:border-primary/20 hover:bg-primary/5 text-gray-400 hover:text-white transition-all group"
                  >
                    <span className="font-[family-name:var(--font-mono)] text-xs font-bold uppercase group-hover:text-primary">
                      :: {link.label}
                    </span>
                    <span className="material-symbols-outlined text-xs ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      arrow_forward
                    </span>
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
