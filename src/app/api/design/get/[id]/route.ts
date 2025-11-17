// app/api/design/get/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { Design } from "@/lib/backend/models/Design";
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Step 1: Authenticate user (using middleware!)
    const authResult = getAuthUser(req);
    
    // Step 2: Check if it's an error response
    if (authResult instanceof NextResponse) {
      return authResult;  // Return 401 error
    }
    
    // Step 3: Now we have the user data safely
    const user = authResult;  // { id: "123", role: "student" or "admin" }

    // Step 4: Validate design ID
    const designId = params.id;
    
    if (!designId) {
      return NextResponse.json(
        { error: "Missing design ID" }, 
        { status: 400 }
      );
    }

    // Step 5: Connect to database
    await connectDB();

    // Step 6: Find design by ID
    const design = await Design.findById(designId).lean();
    
    if (!design) {
      return NextResponse.json(
        { error: "Design not found" }, 
        { status: 404 }
      );
    }

    // Check if design is deleted
    if (design.deleted === true && user.role !== "admin") {
      return NextResponse.json(
        { error: "Design not found" }, // Don't reveal it's deleted
        { status: 404 }
      );
    }

    // Step 7: Check ownership (security!)
    // Only the owner OR an admin can view the design
    if (design.userId.toString() !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - You don't own this design" }, 
        { status: 403 }
      );
    }

    // Step 8: Return the design
    return NextResponse.json({ 
      success: true,
      design 
    });

  } catch (error) {
    // ✅ PROPER ERROR HANDLING
    console.error("Get design error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Server error while fetching design" }, 
      { status: 500 }
    );
  }
}
