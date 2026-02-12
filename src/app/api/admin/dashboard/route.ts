/**
 * Admin Dashboard API Endpoint
 * 
 * Purpose: Provide stats for admin dashboard
 * 
 * Returns:
 * - Total users, active users
 * - Total projects
 * - AI request counts by mode
 * - System status
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/backend/adminMiddleware";
import { connectDB } from "@/lib/backend/db";
import { User } from "@/lib/backend/models/User";
import { AIRequestLog } from "@/lib/backend/models/AIRequestLog";
import { AI_CONFIG } from "@/lib/backend/ai/config";

export async function GET(req: NextRequest) {
  // Check admin authorization
  const authCheck = requireAdmin(req);
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    await connectDB();

    // Get user stats
    const [totalUsers, activeUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
    ]);

    // Get AI request stats
    const aiRequestCounts = await AIRequestLog.aggregate([
      {
        $group: {
          _id: "$mode",
          count: { $sum: 1 },
        },
      },
    ]);

    // Transform to object
    const aiRequests = {
      total: 0,
      student: 0,
      generative: 0,
      manual: 0,
    };

    aiRequestCounts.forEach((item) => {
      aiRequests[item._id as keyof typeof aiRequests] = item.count;
      aiRequests.total += item.count;
    });

    // Get project count (from any project collection you have)
    // For now, return 0 - you can add proper collection query
    const totalProjects = 0;

    // System status
    const systemStatus = {
      useRealAI: AI_CONFIG.USE_REAL_AI,
      model: AI_CONFIG.OPENAI_MODEL,
      rateLimitActive: AI_CONFIG.USE_REAL_AI,
    };

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalProjects,
      aiRequests,
      systemStatus,
    });
  } catch (error: any) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
