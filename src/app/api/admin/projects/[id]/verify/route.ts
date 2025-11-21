// app/api/admin/projects/[id]/verify/route.ts
// ✅ VERIFY ENDPOINT - Admin approves quality designs

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
    return authResult; // Return 401 Unauthorized
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
  // Step 3: Connect to Database
  // ========================================
  await connectDB();

  // ========================================
  // Step 4: Validate Design ID
  // ========================================
  const { id } = params;
  
  if (!id || id.length !== 24) {
    return NextResponse.json(
      { error: "Invalid design ID format" },
      { status: 400 }
    );
  }

  try {
    // ========================================
    // Step 5: Find Design
    // ========================================
    const design = await Design.findById(id);
    
    if (!design) {
      return NextResponse.json(
        { error: "Design not found" },
        { status: 404 }
      );
    }

    // ========================================
    // Step 6: Business Logic Validations
    // ========================================
    
    // 🚫 Don't verify deleted designs 
    if (design.deleted === true) {
      return NextResponse.json(
        { error: "Cannot verify a deleted design" },
        { status: 400 }
      );
    }

    // ========================================
    // Step 7: Update Design Status
    // ========================================
    // Store previous status for audit trail
    const previousStatus = design.status;
    
    // Update verification fields
    design.status = "verified";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    design.verified_by_admin_id = user.id as any;
    design.verified_at = new Date(); // Your Q3 answer - timestamp tracking!
    
    // Save to database
    await design.save();

    // ========================================
    // Step 8: Log Admin Action (Audit Trail)
    // ========================================
    // Your Q2 answer - meta field stores extra context!
    await AdminLog.create({
      adminId: user.id,
      designId: design._id,
      action: "verify",
      meta: {
        previousStatus: previousStatus,     // Was it pending or flagged?
        newStatus: "verified",
        designTitle: design.title || "Untitled",
        note: "Verified via admin panel"
      },
      ip: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "",
    });

    // ========================================
    // Step 9: Success Response
    // ========================================
    return NextResponse.json({
      success: true,
      message: "Design verified successfully",
      design: {
        id: design._id,
        title: design.title,
        status: design.status,
        verified_by: user.id,
        verified_at: design.verified_at,
      }
    });

  } catch (error) {
    // ========================================
    // Error Handling
    // ========================================
    console.error("Verification failed:", error);
    
    return NextResponse.json(
      {
        error: "Failed to verify design",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
