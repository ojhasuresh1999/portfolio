import Link from "next/link";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";

const timelineEntries = [
  {
    year: "2024 - Present",
    title: "Lead Backend Architect",
    description:
      "Driving technical strategy for high-scale distributed systems.",
  },
  {
    year: "2021 - 2023",
    title: "Senior Node.js Developer",
    description: "Specialized in microservices and event-driven architecture.",
  },
  {
    year: "2018 - 2021",
    title: "Full Stack Developer",
    description: "Built complete web solutions using MERN stack.",
  },
  {
    year: "2016",
    title: "Started Coding",
    description: "Hello World! The beginning of the passion.",
  },
];

const orbitTools = [
  { icon: "cloud", color: "#FF9900", position: "top" },
  { icon: "inventory_2", color: "#2496ED", position: "right" },
  { icon: "hub", color: "#326CE5", position: "bottom" },
  { icon: "account_tree", color: "#F05032", position: "left" },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />

      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-slate-900 animate-gradient-xy" />

      <main className="flex-1 px-6 md:px-20 lg:px-40 py-12 pt-32 relative z-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left Column - About & Timeline */}
            <div className="flex flex-col gap-10">
              {/* About Section */}
              <div className="flex flex-col gap-6 animate-fade-in-up">
                <span className="text-primary font-bold tracking-widest uppercase text-xs">
                  About Me
                </span>
                <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight text-white">
                  More Than Just{" "}
                  <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                    Code
                  </span>
                </h1>
                <p className="text-slate-400 text-lg leading-relaxed">
                  I am a Senior Node.js Developer obsessed with system
                  architecture. My journey started with simple scripts and
                  evolved into orchestrating resilient microservices. I believe
                  in writing code that not only works but tells a story of
                  efficiency and scalability.
                </p>
                <div className="flex gap-4 mt-2">
                  <button className="flex items-center gap-2 min-w-[160px] justify-center rounded-lg h-12 px-6 bg-primary text-black font-bold hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 group">
                    <span className="material-symbols-outlined group-hover:animate-bounce">
                      download
                    </span>
                    <span>Download CV</span>
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-4">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                  <span className="material-symbols-outlined text-primary">
                    history_edu
                  </span>
                  My Journey
                </h3>
                <div className="ml-2">
                  {timelineEntries.map((entry, index) => (
                    <div
                      key={entry.year}
                      className="timeline-item opacity-0 animate-fade-in-up"
                      style={{
                        animationDelay: `${0.2 + index * 0.2}s`,
                        animationFillMode: "forwards",
                      }}
                    >
                      <div className="timeline-dot" />
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-primary">
                          {entry.year}
                        </span>
                        <h4 className="font-bold text-lg text-white">
                          {entry.title}
                        </h4>
                        <p className="text-sm text-slate-400">
                          {entry.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="relative" id="contact">
              <div className="relative bg-white/5 p-8 rounded-xl border border-slate-700/50 shadow-xl backdrop-blur-sm overflow-hidden group">
                {/* Meteor Effects */}
                {[
                  { left: "10%", delay: "1s", duration: "4s" },
                  { left: "70%", delay: "0.5s", duration: "6s" },
                  { left: "40%", delay: "2.5s", duration: "3s" },
                  { left: "90%", delay: "1.5s", duration: "5s" },
                ].map((meteor, i) => (
                  <span
                    key={i}
                    className="absolute top-[-20px] w-0.5 h-0.5 bg-slate-500 shadow-[0_0_0_1px_rgba(255,255,255,0.1)] rotate-[215deg] animate-meteor"
                    style={{
                      left: meteor.left,
                      animationDelay: meteor.delay,
                      animationDuration: meteor.duration,
                    }}
                  />
                ))}

                <div className="relative z-10">
                  <h2 className="text-2xl font-bold mb-8 text-white">
                    Let&apos;s Connect
                  </h2>

                  <form className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name Input */}
                      <div className="relative">
                        <input
                          type="text"
                          id="name"
                          placeholder=" "
                          className="peer block w-full appearance-none rounded-lg border border-slate-600 bg-transparent px-2.5 pb-2.5 pt-4 text-sm text-white focus:border-primary focus:outline-none focus:ring-0"
                        />
                        <label
                          htmlFor="name"
                          className="absolute left-1 top-2 z-10 origin-[0] -translate-y-4 scale-75 transform px-2 text-sm text-slate-400 duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-primary"
                        >
                          Name
                        </label>
                      </div>

                      {/* Email Input */}
                      <div className="relative">
                        <input
                          type="email"
                          id="email"
                          placeholder=" "
                          className="peer block w-full appearance-none rounded-lg border border-slate-600 bg-transparent px-2.5 pb-2.5 pt-4 text-sm text-white focus:border-primary focus:outline-none focus:ring-0"
                        />
                        <label
                          htmlFor="email"
                          className="absolute left-1 top-2 z-10 origin-[0] -translate-y-4 scale-75 transform px-2 text-sm text-slate-400 duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-primary"
                        >
                          Email
                        </label>
                      </div>
                    </div>

                    {/* Subject Input */}
                    <div className="relative">
                      <input
                        type="text"
                        id="subject"
                        placeholder=" "
                        className="peer block w-full appearance-none rounded-lg border border-slate-600 bg-transparent px-2.5 pb-2.5 pt-4 text-sm text-white focus:border-primary focus:outline-none focus:ring-0"
                      />
                      <label
                        htmlFor="subject"
                        className="absolute left-1 top-2 z-10 origin-[0] -translate-y-4 scale-75 transform px-2 text-sm text-slate-400 duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-primary"
                      >
                        Subject
                      </label>
                    </div>

                    {/* Message Textarea */}
                    <div className="relative">
                      <textarea
                        id="message"
                        placeholder=" "
                        rows={4}
                        className="peer block w-full appearance-none rounded-lg border border-slate-600 bg-transparent px-2.5 pb-2.5 pt-4 text-sm text-white focus:border-primary focus:outline-none focus:ring-0 resize-none"
                      />
                      <label
                        htmlFor="message"
                        className="absolute left-1 top-2 z-10 origin-[0] -translate-y-4 scale-75 transform px-2 text-sm text-slate-400 duration-300 peer-placeholder-shown:top-6 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-primary"
                      >
                        Message
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="mt-4 w-full relative overflow-hidden rounded-lg font-bold text-white py-4 bg-gradient-to-r from-primary via-blue-400 to-primary bg-[length:200%_200%] animate-gradient-xy shadow-lg hover:shadow-primary/40 transition-shadow"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-xl">
                          send
                        </span>
                        <span>Send Message</span>
                      </span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Tools of the Trade - Orbit Section */}
          <div className="mt-32 relative">
            <div className="flex flex-col items-center mb-12 relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">
                Tools of the Trade
              </h2>
              <div className="h-1 w-20 bg-primary rounded-full" />
              <p className="mt-4 text-slate-400 text-center max-w-lg">
                My digital galaxy. These technologies orbit my daily development
                workflow.
              </p>
            </div>

            {/* Orbit Animation */}
            <div className="flex items-center justify-center h-[500px] w-full overflow-hidden relative">
              {/* Background Glow */}
              <div className="absolute w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />

              {/* Center Node - Node.js */}
              <div className="relative z-20 w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center shadow-xl border border-slate-700 animate-float">
                <span
                  className="material-symbols-outlined text-5xl"
                  style={{ color: "#339933" }}
                >
                  hexagon
                </span>
              </div>

              {/* Orbit Ring */}
              <div className="absolute w-[320px] h-[320px] md:w-[400px] md:h-[400px] border border-dashed border-slate-700 rounded-full animate-orbit">
                {/* AWS - Top */}
                <div className="absolute left-1/2 -top-6 -ml-6 w-12 h-12 md:w-16 md:h-16 bg-slate-800 rounded-full shadow-lg flex items-center justify-center border border-slate-700 animate-reverse-orbit">
                  <span
                    className="material-symbols-outlined text-2xl md:text-3xl"
                    style={{ color: "#FF9900" }}
                  >
                    cloud
                  </span>
                </div>

                {/* Docker - Right */}
                <div className="absolute top-1/2 -right-6 -mt-6 w-12 h-12 md:w-16 md:h-16 bg-slate-800 rounded-full shadow-lg flex items-center justify-center border border-slate-700 animate-reverse-orbit">
                  <span
                    className="material-symbols-outlined text-2xl md:text-3xl"
                    style={{ color: "#2496ED" }}
                  >
                    inventory_2
                  </span>
                </div>

                {/* Kubernetes - Bottom */}
                <div className="absolute left-1/2 -bottom-6 -ml-6 w-12 h-12 md:w-16 md:h-16 bg-slate-800 rounded-full shadow-lg flex items-center justify-center border border-slate-700 animate-reverse-orbit">
                  <span
                    className="material-symbols-outlined text-2xl md:text-3xl"
                    style={{ color: "#326CE5" }}
                  >
                    hub
                  </span>
                </div>

                {/* Git - Left */}
                <div className="absolute top-1/2 -left-6 -mt-6 w-12 h-12 md:w-16 md:h-16 bg-slate-800 rounded-full shadow-lg flex items-center justify-center border border-slate-700 animate-reverse-orbit">
                  <span
                    className="material-symbols-outlined text-2xl md:text-3xl"
                    style={{ color: "#F05032" }}
                  >
                    account_tree
                  </span>
                </div>
              </div>

              {/* Inner Ring */}
              <div className="absolute w-[200px] h-[200px] border border-slate-800 rounded-full opacity-50" />
            </div>
          </div>
        </div>
      </main>

      {/* Floating Social Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 p-3 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl z-50 transition-all hover:scale-105">
        {[
          { icon: "linkedin", href: "https://linkedin.com", label: "LinkedIn" },
          { icon: "github", href: "https://github.com", label: "GitHub" },
          { icon: "mail", href: "mailto:hello@example.com", label: "Email" },
          { icon: "description", href: "/resume", label: "Resume" },
        ].map((link) => (
          <Link
            key={link.label}
            href={link.href}
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel={
              link.href.startsWith("http") ? "noopener noreferrer" : undefined
            }
            className="group relative flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 hover:bg-primary hover:-translate-y-2 transition-all duration-300"
          >
            <span className="material-symbols-outlined text-2xl text-slate-200 group-hover:text-black">
              {link.icon === "linkedin"
                ? "work"
                : link.icon === "github"
                  ? "code"
                  : link.icon === "mail"
                    ? "alternate_email"
                    : "description"}
            </span>
            <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
              {link.label}
            </span>
          </Link>
        ))}
      </div>

      <Footer />
    </>
  );
}
