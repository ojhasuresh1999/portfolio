// Prisma client will be generated after running prisma generate
// For now, using a placeholder that won't break the build

// TODO: Uncomment after running `pnpm prisma generate`
// import { PrismaClient } from "@/generated/prisma";

// Placeholder for build
const PrismaClient = class {
  constructor() {}
};

type PrismaClientType = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
