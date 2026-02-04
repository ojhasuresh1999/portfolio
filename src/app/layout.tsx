import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ChatWidget } from "@/components/chat";
import { QueryProvider } from "@/providers/query-provider";
import { SocketHealthProvider } from "@/providers/socket-health-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DEV_IO | Backend Developer Portfolio",
  description:
    "I build high-performance distributed systems and resilient microservices that power the next generation of digital experiences.",
  keywords: [
    "Backend Developer",
    "Node.js",
    "TypeScript",
    "Microservices",
    "System Architecture",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} bg-obsidian font-[family-name:var(--font-display)] text-slate-300 antialiased`}
      >
        <QueryProvider>
          <SocketHealthProvider>
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none shimmer-bg" />
            <div className="fixed inset-0 z-0 pointer-events-none aurora-bg animate-pulse opacity-50" />
            <div className="fixed inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none" />

            {/* Main Content */}
            <div className="relative z-10 flex flex-col min-h-screen">
              {children}
            </div>

            {/* Floating Chat Widget */}
            <ChatWidget />
          </SocketHealthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
