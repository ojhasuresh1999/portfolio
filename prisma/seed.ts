import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Load environment variables
import "dotenv/config";

// Create a connection pool for PostgreSQL
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seed...\n");

  // ============================================
  // Site Settings
  // ============================================
  console.log("📝 Creating site settings...");
  const settings = await prisma.siteSettings.upsert({
    where: { id: "default-settings" },
    update: {},
    create: {
      id: "default-settings",
      siteName: "DEV_IO",
      siteTagline: "Backend Developer Portfolio",
      logoText: "DEV_IO",
      statusText: "System Online",
      footerLatency: "12ms",
      metaTitle: "DEV_IO | Backend Developer Portfolio",
      metaDescription:
        "Backend developer specializing in Node.js, PostgreSQL, and cloud infrastructure.",
    },
  });
  console.log(`   ✓ Site settings created: ${settings.siteName}\n`);

  // ============================================
  // Tech Stack
  // ============================================
  console.log("💻 Creating tech stack items...");
  const techStack = [
    { name: "Node.js", icon: "server", color: "#68A063", order: 1 },
    { name: "TypeScript", icon: "code", color: "#3178C6", order: 2 },
    { name: "PostgreSQL", icon: "database", color: "#4169E1", order: 3 },
    { name: "Redis", icon: "zap", color: "#DC382D", order: 4 },
    { name: "Docker", icon: "box", color: "#2496ED", order: 5 },
    { name: "AWS", icon: "cloud", color: "#FF9900", order: 6 },
    { name: "GraphQL", icon: "share-2", color: "#E10098", order: 7 },
    { name: "Next.js", icon: "triangle", color: "#000000", order: 8 },
  ];

  for (const tech of techStack) {
    await prisma.techStack.upsert({
      where: { id: `tech-${tech.name.toLowerCase().replace(/\./g, "-")}` },
      update: tech,
      create: {
        id: `tech-${tech.name.toLowerCase().replace(/\./g, "-")}`,
        ...tech,
        isVisible: true,
      },
    });
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
        "RESTful API for real-time analytics with WebSocket support, built on PostgreSQL and TimescaleDB.",
      technologies: [
        "Node.js",
        "PostgreSQL",
        "TimescaleDB",
        "WebSocket",
        "GraphQL",
      ],
      codeSnippet: `app.get('/api/metrics/:period', async (req, res) => {
  const metrics = await timescale.query(\`
    SELECT time_bucket('1 hour', time) AS bucket,
           avg(value) as avg_value
    FROM metrics
    WHERE time > now() - interval '\${req.params.period}'
    GROUP BY bucket
  \`);
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
      technologies: ["Node.js", "JWT", "OAuth2", "PostgreSQL", "Redis"],
      accentColor: "primary",
      order: 3,
      isFeatured: false,
      isVisible: true,
    },
  ];

  for (const project of projects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: project,
      create: project,
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
    },
    {
      title: "Database Architecture",
      description:
        "Designing scalable database schemas and optimizing query performance.",
      icon: "database",
      tags: ["PostgreSQL", "MongoDB", "Redis", "TimescaleDB"],
      gridSpan: "1",
      order: 2,
    },
    {
      title: "API Design",
      description:
        "RESTful and GraphQL API design with focus on DX and performance.",
      icon: "globe",
      tags: ["REST", "GraphQL", "gRPC", "WebSocket"],
      gridSpan: "1",
      order: 3,
    },
    {
      title: "DevOps & Cloud",
      description:
        "Infrastructure as code and cloud-native deployment strategies.",
      icon: "cloud",
      tags: ["Docker", "Kubernetes", "AWS", "Terraform"],
      gridSpan: "2",
      order: 4,
    },
  ];

  for (const card of skillCards) {
    await prisma.skillCard.upsert({
      where: { id: `skill-${card.title.toLowerCase().replace(/\s+/g, "-")}` },
      update: card,
      create: {
        id: `skill-${card.title.toLowerCase().replace(/\s+/g, "-")}`,
        ...card,
        isVisible: true,
      },
    });
    console.log(`   ✓ ${card.title}`);
  }
  console.log("");

  // ============================================
  // Social Links
  // ============================================
  console.log("🔗 Creating social links...");
  const socialLinks = [
    { platform: "GitHub", url: "https://github.com", icon: "github", order: 1 },
    {
      platform: "LinkedIn",
      url: "https://linkedin.com",
      icon: "linkedin",
      order: 2,
    },
    {
      platform: "Twitter",
      url: "https://twitter.com",
      icon: "twitter",
      order: 3,
    },
    {
      platform: "Email",
      url: "mailto:hello@example.com",
      icon: "mail",
      order: 4,
    },
  ];

  for (const link of socialLinks) {
    await prisma.socialLink.upsert({
      where: { id: `social-${link.platform.toLowerCase()}` },
      update: link,
      create: {
        id: `social-${link.platform.toLowerCase()}`,
        ...link,
        isVisible: true,
      },
    });
    console.log(`   ✓ ${link.platform}`);
  }
  console.log("");

  // ============================================
  // Hero Content
  // ============================================
  console.log("🦸 Creating hero content...");
  await prisma.heroContent.upsert({
    where: { id: "hero-main" },
    update: {},
    create: {
      id: "hero-main",
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
  });
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
    },
    {
      year: "2022 - 2024",
      title: "Senior Backend Developer",
      description:
        "Built microservices architecture handling 10M+ daily requests with 99.9% uptime.",
      order: 2,
    },
    {
      year: "2020 - 2022",
      title: "Backend Developer",
      description:
        "Developed RESTful APIs and database solutions for various client projects.",
      order: 3,
    },
  ];

  for (const entry of timeline) {
    await prisma.timelineEntry.upsert({
      where: { id: `timeline-${entry.order}` },
      update: entry,
      create: {
        id: `timeline-${entry.order}`,
        ...entry,
        isVisible: true,
      },
    });
    console.log(`   ✓ ${entry.year}: ${entry.title}`);
  }
  console.log("");

  console.log("✅ Database seed completed successfully!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
