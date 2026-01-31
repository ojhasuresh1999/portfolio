import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize Prisma and database packages to avoid bundling issues
  serverExternalPackages: [
    "@prisma/adapter-pg",
    "@prisma/client-runtime-utils",
    "pg",
    "pg-pool",
  ],
};

export default nextConfig;
