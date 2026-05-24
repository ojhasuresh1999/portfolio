import { LeftSidebar } from "@/components/ui/left-sidebar";
import { HeroSection } from "@/components/sections/hero-section";
import { TechArsenal } from "@/components/sections/tech-arsenal";
import { DeploymentsSection } from "@/components/sections/deployments-section";
import { SystemLogsSection } from "@/components/sections/system-logs-section";

import { projectService } from "@/server/services/project.service";
import { blogService } from "@/server/services/blog.service";

export default async function HomePage() {
  const [projectsResult, blogsResult] = await Promise.all([
    projectService.getAll({ limit: 4, featured: true }),
    blogService.getAll({ limit: 2 }),
  ]);

  // Serialize Mongoose documents to plain objects to fix React Server Component serialization error
  const projects = projectsResult.success
    ? JSON.parse(JSON.stringify(projectsResult.data.items))
    : [];
  const posts = blogsResult.success
    ? JSON.parse(JSON.stringify(blogsResult.data.items))
    : [];

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
