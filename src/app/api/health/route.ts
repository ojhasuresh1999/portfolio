import { connectToDatabase, getConnectionState } from "@/lib/mongodb";
import type { HealthCheckResponse } from "@/server/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: System Health Check
 *     description: Returns the current status of the application and database connection
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: healthy
 *                     database:
 *                       type: string
 *                       example: connected
 *                     uptime:
 *                       type: number
 *       503:
 *         description: System is unhealthy (database disconnected)
 */
export async function GET(): Promise<NextResponse> {
  const startTime = Date.now();

  let databaseStatus: "connected" | "disconnected" = "disconnected";

  try {
    // Test database connectivity
    await connectToDatabase();
    databaseStatus =
      getConnectionState() === "connected" ? "connected" : "disconnected";
  } catch {
    databaseStatus = "disconnected";
  }

  const response: HealthCheckResponse = {
    status: databaseStatus === "connected" ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "development",
    database: databaseStatus,
    uptime: process.uptime(),
    version: process.env.npm_package_version ?? "1.0.0",
  };

  const statusCode = databaseStatus === "connected" ? 200 : 503;

  // Add response time header
  const responseTime = Date.now() - startTime;

  return NextResponse.json(
    { success: response.status === "healthy", data: response },
    {
      status: statusCode,
      headers: {
        "X-Response-Time": `${responseTime}ms`,
      },
    },
  );
}
