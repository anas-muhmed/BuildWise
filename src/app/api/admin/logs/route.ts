// app/api/admin/logs/route.ts - View Admin Activity Logs
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { AdminLog } from "@/lib/backend/models/AdminLog";
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function GET(req: NextRequest) {
  try {
    // Step 1: Authenticate user
    const authResult = getAuthUser(req);
    
    // Step 2: Check if authentication failed
    if (authResult instanceof NextResponse) {
      return authResult;  // Return 401 error
    }
    
    // Step 3: Extract user data
    const user = authResult;
    
    // Step 4: Admin-only access (RBAC - Role Based Access Control)
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" }, 
        { status: 403 }
      );
    }

    // Step 5: Connect to database
    await connectDB();

    // Step 6: Fetch logs with population (JOIN equivalent in SQL)
    // .populate() = get related data from other collections
    // .limit(50) = only get 50 most recent logs (prevents massive responses)
    // .lean() = return plain JS objects (faster, no Mongoose overhead)
    const logs = await AdminLog.find()
      .sort({ createdAt: -1 })           // Newest first
      .limit(50)                         // Limit to 50 records
      .populate("adminId", "name email") // Get admin's name & email
      .populate("designId", "title")     // Get design's title
      .lean();

    // Step 7: Return logs with metadata
    return NextResponse.json({ 
      success: true,
      logs,
      count: logs.length
    });

  } catch (error) {
    // ✅ PROPER ERROR HANDLING (important for debugging!)
    console.error("Admin logs error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Server error while fetching logs" }, 
      { status: 500 }
    );
  }
}
