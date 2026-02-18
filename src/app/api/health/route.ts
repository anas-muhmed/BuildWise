// app/api/health/route.ts
/**
 * Health check endpoint for container orchestration
 * Used by Docker, Kubernetes, load balancers
 * 
 * GET /api/health - Basic health check
 * GET /api/health/ready - Readiness probe (checks dependencies)
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";

/**
 * Basic liveness check
 * Returns 200 if server is running
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");

  // Readiness check (includes dependencies)
  if (type === "ready") {
    return handleReadiness();
  }

  // Basic liveness (just responds)
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
}

/**
 * Readiness probe - checks if app can handle requests
 * Verifies database connectivity
 */
async function handleReadiness() {
  const checks: Record<string, unknown> = {
    server: "ok",
    timestamp: new Date().toISOString(),
  };

  try {
    // Check database connectivity
    await connectDB();
    checks.database = "ok";
  } catch (error) {
    checks.database = "error";
    checks.databaseError = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(checks, { status: 503 });
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  checks.memory = {
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
  };

  return NextResponse.json(checks);
}
