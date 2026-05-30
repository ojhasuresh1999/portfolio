"use client";

import { LeftSidebar } from "@/components/ui/left-sidebar";
import { HeroSection } from "@/components/sections/hero-section";
import { TechArsenal } from "@/components/sections/tech-arsenal";
import { DeploymentsSection } from "@/components/sections/deployments-section";
import { SystemLogsSection } from "@/components/sections/system-logs-section";

import { useProjects } from "@/hooks/queries/use-projects";
import { useBlogPosts } from "@/hooks/queries/use-blog";

export default function HomePage() {
  const { data: projects = [] } = useProjects({ limit: 100, featured: true });
  const { data: posts = [] } = useBlogPosts({ limit: 100, featured: true });

  return (
    <>
      <div className="flex w-full max-w-[1400px] mx-auto flex-1">
        {/* Left Sidebar with Beam Animation */}
        <LeftSidebar />

        {/* Main Content */}
        <main className="flex-1 w-full px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20 relative z-10 flex flex-col">
          {/* Hero Section */}
          <HeroSection />

          {/* Technical Arsenal */}
          <TechArsenal />

          {/* Deployments / Projects */}
          <DeploymentsSection projects={projects} />

          {/* System Logs / Blog Preview */}
          <SystemLogsSection posts={posts} />
        </main>
      </div>
    </>
  );
}
