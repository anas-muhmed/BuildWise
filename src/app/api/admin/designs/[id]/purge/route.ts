// app/api/admin/designs/[id]/purge/route.ts
// 🗑️ PERMANENT DELETE (Admin-only) - Destroys data completely

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { Design } from "@/lib/backend/models/Design";
import { getAuthUser } from "@/lib/backend/authMiddleware";
import { AdminLog } from "@/lib/backend/models/AdminLog";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // ========================================
  // Step 1: Authentication Check
  // ========================================
  const authResult = getAuthUser(req);
  
  // Check if auth failed (returns error response)
  if (authResult instanceof NextResponse) {
    return authResult; // Return 401 Unauthorized
  }
  
  const user = authResult; // Extract user data from JWT

  // ========================================
  // Step 2: Authorization Check (Admin Only!)
  // ========================================
  // 🔐 CRITICAL: Only admins can permanently destroy data
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden - Admin access required for purge operations" },
      { status: 403 }
    );
  }

  // ========================================
  // Step 3: Connect to Database
  // ========================================
  // 💡 We connect AFTER auth checks to avoid wasting resources
  await connectDB();

  // ========================================
  // Step 4: Validate Design ID
  // ========================================
  const { id } = params;
  
  // MongoDB ObjectId is exactly 24 hex characters
  if (!id || id.length !== 24) {
    return NextResponse.json(
      { error: "Invalid design ID format" },
      { status: 400 }
    );
  }

  try {
    // ========================================
    // Step 5: Check if Design Exists
    // ========================================
    const design = await Design.findById(id);
    
    if (!design) {
      return NextResponse.json(
        { error: "Design not found - may already be deleted" },
        { status: 404 }
      );
    }

    // ========================================
    // Step 6: PERMANENT DELETION
    // ========================================
    // ⚠️ DANGER ZONE: This DESTROYS data - no recovery!
    await Design.findByIdAndDelete(id);

    // ========================================
    // Step 7: Log Admin Action (Audit Trail)
    // ========================================
    // 📝 Critical for compliance: WHO deleted WHAT and WHEN
    await AdminLog.create({
      adminId: user.id,
      designId: id,
      action: "purge",
      meta: {
        designTitle: design.title || "Untitled",
        originalOwner: design.userId.toString(),
      },
      ip: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "",
    });

    // ========================================
    // Step 8: Success Response
    // ========================================
    return NextResponse.json({
      success: true,
      message: "Design permanently deleted",
      designId: id,
      purgedBy: user.id,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    // ========================================
    // Error Handling
    // ========================================
    console.error("Purge operation failed:", error);
    
    return NextResponse.json(
      {
        error: "Failed to purge design",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
