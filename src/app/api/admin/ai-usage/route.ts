/**
 * Admin AI Usage API
 * 
 * Purpose: Return AI request logs for observability
 * 
 * Query params:
 * - page: pagination
 * - limit: results per page
 * - mode: filter by mode
 * - success: filter by success status
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/backend/adminMiddleware";
import { connectDB } from "@/lib/backend/db";
import { AIRequestLog } from "@/lib/backend/models/AIRequestLog";
import { User } from "@/lib/backend/models/User";

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

    // Parse query params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const mode = searchParams.get("mode") || undefined;
    const successFilter = searchParams.get("success");

    // Build query
    const query: any = {};
    if (mode) query.mode = mode;
    if (successFilter !== null && successFilter !== undefined) {
      query.success = successFilter === "true";
    }

    // Get total count for pagination
    const total = await AIRequestLog.countDocuments(query);

    // Get logs with pagination
    const logs = await AIRequestLog.find(query)
      .sort({ timestamp: -1 }) // Most recent first
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get unique user IDs
    const userIds = [...new Set(logs.map((log) => log.userId))];

    // Fetch user data
    const users = await User.find({ _id: { $in: userIds } })
      .select("_id name email")
      .lean();

    // Create user lookup map
    const userMap = new Map(
      users.map((u) => [u._id.toString(), { name: u.name, email: u.email }])
    );

    // Enrich logs with user data
    const enrichedLogs = logs.map((log) => ({
      ...log,
      user: userMap.get(log.userId) || { name: "Unknown", email: "—" },
    }));

    // Calculate stats
    const stats = {
      total,
      successRate: total > 0 
        ? Math.round((logs.filter(l => l.success).length / logs.length) * 100)
        : 0,
      validationRate: total > 0
        ? Math.round((logs.filter(l => l.validationPassed).length / logs.length) * 100)
        : 0,
    };

    return NextResponse.json({
      logs: enrichedLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error: any) {
    console.error("Admin AI usage error:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI usage logs" },
      { status: 500 }
    );
  }
}
