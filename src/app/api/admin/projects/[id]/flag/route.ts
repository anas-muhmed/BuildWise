// app/api/admin/projects/[id]/flag/route.ts
// 🚩 FLAG ENDPOINT - Admin marks problematic designs

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { Design } from "@/lib/backend/models/Design";
import { getAuthUser } from "@/lib/backend/authMiddleware";
import { AdminLog } from "@/lib/backend/models/AdminLog";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // ========================================
  // Step 1: Authentication Check
  // ========================================
  const authResult = getAuthUser(req);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const user = authResult;

  // ========================================
  // Step 2: Authorization Check (Admin Only!)
  // ========================================
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden - Admin access required" },
      { status: 403 }
    );
  }

  // ========================================
  // Step 3: Parse Request Body & Validate Reason
  // ========================================
  try {
    const body = await req.json();
    const reason = body.reason?.trim();

    // Reason is REQUIRED for flags (accountability!)
    if (!reason || reason.length < 3) {
      return NextResponse.json(
        { error: "Flag reason required (minimum 3 characters)" },
        { status: 400 }
      );
    }

    // Prevent abuse - limit reason length
    if (reason.length > 500) {
      return NextResponse.json(
        { error: "Reason too long (maximum 500 characters)" },
        { status: 400 }
      );
    }

    // ========================================
    // Step 4: Connect to Database
    // ========================================
    await connectDB();

    // ========================================
    // Step 5: Validate Design ID
    // ========================================
    const { id } = params;
    
    if (!id || id.length !== 24) {
      return NextResponse.json(
        { error: "Invalid design ID format" },
        { status: 400 }
      );
    }

    // ========================================
    // Step 6: Find Design
    // ========================================
    const design = await Design.findById(id);
    
    if (!design) {
      return NextResponse.json(
        { error: "Design not found" },
        { status: 404 }
      );
    }

    // ========================================
    // Step 7: Business Logic Validations
    // ========================================
    
    // Can't flag deleted designs
    if (design.deleted === true) {
      return NextResponse.json(
        { error: "Cannot flag a deleted design" },
        { status: 400 }
      );
    }

    // ========================================
    // Step 8: Update Design Status
    // ========================================
    const previousStatus = design.status;
    
    // Set as flagged
    design.status = "flagged";
    
    // Save to database
    await design.save();

    // ========================================
    // Step 9: Log Admin Action with Reason
    // ========================================
    await AdminLog.create({
      adminId: user.id,
      designId: design._id,
      action: "flag",
      meta: {
        previousStatus: previousStatus,
        newStatus: "flagged",
        reason: reason,  // 🔑 Store the flag reason!
        designTitle: design.title || "Untitled",
      },
      ip: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "",
    });

    // ========================================
    // Step 10: Success Response
    // ========================================
    return NextResponse.json({
      success: true,
      message: "Design flagged successfully",
      design: {
        id: design._id,
        title: design.title,
        status: design.status,
        flagReason: reason,
      }
    });

  } catch (error) {
    console.error("Flag operation failed:", error);
    
    return NextResponse.json(
      {
        error: "Failed to flag design",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
