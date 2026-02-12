/**
 * Admin System API
 * 
 * Purpose: System health and configuration
 * 
 * GET: System status and metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/backend/adminMiddleware";
import { connectDB } from "@/lib/backend/db";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const authCheck = requireAdmin(req);
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database not connected");
    }

    // Get database stats
    const usersCount = await db.collection("users").countDocuments();
    const projectsCount = await db.collection("genai_v2").countDocuments();
    const logsCount = await db.collection("airequestlogs").countDocuments();

    // Get recent AI errors
    const recentErrors = await db
      .collection("airequestlogs")
      .find({ success: false })
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();

    // System info
    const systemInfo = {
      useRealAI: process.env.USE_REAL_AI === "true",
      openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
      nodeEnv: process.env.NODE_ENV || "development",
      databaseConnected: mongoose.connection.readyState === 1,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };

    return NextResponse.json({
      system: systemInfo,
      stats: {
        users: usersCount,
        projects: projectsCount,
        logs: logsCount,
      },
      recentErrors,
    });
  } catch (error: any) {
    console.error("Admin system error:", error);
    return NextResponse.json(
      { error: "Failed to fetch system info" },
      { status: 500 }
    );
  }
}
