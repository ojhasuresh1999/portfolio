/**
 * MongoDB Seed Script
 * Populates the database with initial sample data
 */

import "dotenv/config";
import mongoose from "mongoose";

// Import models
import { SiteSettings } from "../src/models/SiteSettings";
import { TechStack } from "../src/models/TechStack";
import { Project } from "../src/models/Project";
import { SkillCard } from "../src/models/SkillCard";
import { SocialLink } from "../src/models/SocialLink";
import { HeroContent } from "../src/models/HeroContent";
import { TimelineEntry } from "../src/models/TimelineEntry";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

async function seed() {
  console.log("🌱 Starting MongoDB seed...\n");

  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected successfully\n");

    // ============================================
    // Site Settings
    // ============================================
    console.log("📝 Creating site settings...");
    await SiteSettings.findOneAndUpdate(
      {},
      {
        siteName: "DEV_IO",
        siteTagline: "Backend Developer Portfolio",
        logoText: "DEV_IO",
        statusText: "System Online",
        footerLatency: "12ms",
        metaTitle: "DEV_IO | Backend Developer Portfolio",
        metaDescription:
          "Backend developer specializing in Node.js, MongoDB, and cloud infrastructure.",
      },
      { upsert: true, new: true },
    );
    console.log("   ✓ Site settings created\n");

    // ============================================
    // Tech Stack
    // ============================================
    console.log("💻 Creating tech stack items...");
    const techStack = [
      { name: "Node.js", icon: "server", color: "#68A063", order: 1 },
      { name: "TypeScript", icon: "code", color: "#3178C6", order: 2 },
      { name: "MongoDB", icon: "database", color: "#47A248", order: 3 },
      { name: "Redis", icon: "zap", color: "#DC382D", order: 4 },
      { name: "Docker", icon: "box", color: "#2496ED", order: 5 },
      { name: "AWS", icon: "cloud", color: "#FF9900", order: 6 },
      { name: "GraphQL", icon: "share-2", color: "#E10098", order: 7 },
      { name: "Next.js", icon: "triangle", color: "#000000", order: 8 },
    ];

    for (const tech of techStack) {
      await TechStack.findOneAndUpdate(
        { name: tech.name },
        { ...tech, isVisible: true },
        { upsert: true, new: true },
      );
      console.log(`   ✓ ${tech.name}`);
    }
    console.log("");

    // ============================================
    // Sample Projects
    // ============================================
    console.log("🚀 Creating sample projects...");
    const projects = [
      {
        slug: "distributed-task-queue",
        title: "Distributed Task Queue",
        description:
          "High-performance task queue system built with Node.js, Redis, and BullMQ for processing millions of jobs.",
        longDescription: `A production-ready distributed task queue system capable of processing millions of jobs per day.
        
Features:
- Priority queues with configurable weights
- Job retries with exponential backoff
- Real-time monitoring dashboard
- Horizontal scaling support
- Dead letter queues for failed jobs`,
        technologies: ["Node.js", "TypeScript", "Redis", "BullMQ", "Docker"],
        codeSnippet: `const queue = new Queue('tasks', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 }
  }
});`,
        accentColor: "primary",
        order: 1,
        isFeatured: true,
        isVisible: true,
      },
      {
        slug: "real-time-analytics-api",
        title: "Real-time Analytics API",
        description:
          "RESTful API for real-time analytics with WebSocket support, built on MongoDB and TimescaleDB.",
        technologies: [
          "Node.js",
          "MongoDB",
          "TimescaleDB",
          "WebSocket",
          "GraphQL",
        ],
        codeSnippet: `app.get('/api/metrics/:period', async (req, res) => {
  const metrics = await collection.aggregate([
    { $match: { time: { $gte: startTime } } },
    { $group: { _id: "$bucket", avg: { $avg: "$value" } } }
  ]);
  res.json(metrics);
});`,
        accentColor: "secondary",
        order: 2,
        isFeatured: true,
        isVisible: true,
      },
      {
        slug: "auth-microservice",
        title: "Authentication Microservice",
        description:
          "Secure authentication service with JWT, OAuth2, and multi-factor authentication support.",
        technologies: ["Node.js", "JWT", "OAuth2", "MongoDB", "Redis"],
        accentColor: "primary",
        order: 3,
        isFeatured: false,
        isVisible: true,
      },
    ];

    for (const project of projects) {
      await Project.findOneAndUpdate({ slug: project.slug }, project, {
        upsert: true,
        new: true,
      });
      console.log(`   ✓ ${project.title}`);
    }
    console.log("");

    // ============================================
    // Skill Cards
    // ============================================
    console.log("🎯 Creating skill cards...");
    const skillCards = [
      {
        title: "Core Runtime",
        description:
          "Expert in modern JavaScript runtimes and async programming patterns.",
        icon: "cpu",
        tags: ["Node.js v20+", "Deno", "Bun", "Event Loop"],
        gridSpan: "2",
        order: 1,
        isVisible: true,
      },
      {
        title: "Database Architecture",
        description:
          "Designing scalable database schemas and optimizing query performance.",
        icon: "database",
        tags: ["MongoDB", "PostgreSQL", "Redis", "TimescaleDB"],
        gridSpan: "1",
        order: 2,
        isVisible: true,
      },
      {
        title: "API Design",
        description:
          "RESTful and GraphQL API design with focus on DX and performance.",
        icon: "globe",
        tags: ["REST", "GraphQL", "gRPC", "WebSocket"],
        gridSpan: "1",
        order: 3,
        isVisible: true,
      },
      {
        title: "DevOps & Cloud",
        description:
          "Infrastructure as code and cloud-native deployment strategies.",
        icon: "cloud",
        tags: ["Docker", "Kubernetes", "AWS", "Terraform"],
        gridSpan: "2",
        order: 4,
        isVisible: true,
      },
    ];

    for (const card of skillCards) {
      await SkillCard.findOneAndUpdate({ title: card.title }, card, {
        upsert: true,
        new: true,
      });
      console.log(`   ✓ ${card.title}`);
    }
    console.log("");

    // ============================================
    // Social Links
    // ============================================
    console.log("🔗 Creating social links...");
    const socialLinks = [
      {
        platform: "GitHub",
        url: "https://github.com",
        icon: "github",
        order: 1,
        isVisible: true,
      },
      {
        platform: "LinkedIn",
        url: "https://linkedin.com",
        icon: "linkedin",
        order: 2,
        isVisible: true,
      },
      {
        platform: "Twitter",
        url: "https://twitter.com",
        icon: "twitter",
        order: 3,
        isVisible: true,
      },
      {
        platform: "Email",
        url: "mailto:hello@example.com",
        icon: "mail",
        order: 4,
        isVisible: true,
      },
    ];

    for (const link of socialLinks) {
      await SocialLink.findOneAndUpdate({ platform: link.platform }, link, {
        upsert: true,
        new: true,
      });
      console.log(`   ✓ ${link.platform}`);
    }
    console.log("");

    // ============================================
    // Hero Content
    // ============================================
    console.log("🦸 Creating hero content...");
    await HeroContent.findOneAndUpdate(
      { isActive: true },
      {
        title: "Architecting the Invisible Backbone.",
        highlightWord: "Invisible",
        terminalCommand: "init backend_protocol --force",
        description:
          "I build robust, scalable backend systems that power modern applications. From database optimization to distributed systems, I turn complex requirements into elegant solutions.",
        ctaPrimaryText: "Initialize Project",
        ctaPrimaryLink: "#contact",
        ctaSecondaryText: "View Source",
        ctaSecondaryLink: "#projects",
        isActive: true,
      },
      { upsert: true, new: true },
    );
    console.log("   ✓ Hero content created\n");

    // ============================================
    // Timeline
    // ============================================
    console.log("📅 Creating timeline entries...");
    const timeline = [
      {
        year: "2024 - Present",
        title: "Lead Backend Architect",
        description:
          "Designing and implementing scalable backend systems for high-traffic applications.",
        order: 1,
        isVisible: true,
      },
      {
        year: "2022 - 2024",
        title: "Senior Backend Developer",
        description:
          "Built microservices architecture handling 10M+ daily requests with 99.9% uptime.",
        order: 2,
        isVisible: true,
      },
      {
        year: "2020 - 2022",
        title: "Backend Developer",
        description:
          "Developed RESTful APIs and database solutions for various client projects.",
        order: 3,
        isVisible: true,
      },
    ];

    for (const entry of timeline) {
      await TimelineEntry.findOneAndUpdate({ year: entry.year }, entry, {
        upsert: true,
        new: true,
      });
      console.log(`   ✓ ${entry.year}: ${entry.title}`);
    }
    console.log("");

    console.log("✅ Database seed completed successfully!\n");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
}

seed();
