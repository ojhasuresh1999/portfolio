import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { LeftSidebar } from "@/components/ui/left-sidebar";
import { HeroSection } from "@/components/sections/hero-section";
import { TechArsenal } from "@/components/sections/tech-arsenal";
import { DeploymentsSection } from "@/components/sections/deployments-section";
import { SystemLogsSection } from "@/components/sections/system-logs-section";

export default function HomePage() {
  return (
    <>
      <Navbar />

      <div className="flex w-full max-w-[1400px] mx-auto flex-1">
        {/* Left Sidebar with Beam Animation */}
        <LeftSidebar />

        {/* Main Content */}
        <main className="flex-1 w-full px-6 pt-32 pb-20 relative z-10">
          {/* Hero Section */}
          <HeroSection />

          {/* Technical Arsenal */}
          <TechArsenal />

          {/* Deployments / Projects */}
          <DeploymentsSection />

          {/* System Logs / Blog Preview */}
          <SystemLogsSection />
        </main>
      </div>

      <Footer />
    </>
  );
}
