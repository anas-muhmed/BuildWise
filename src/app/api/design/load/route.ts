// app/api/design/load/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { Design } from "@/lib/backend/models/Design";
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function GET(req: NextRequest) {
  try {
    // Step 1: Authenticate user (using middleware!)
    const authResult = getAuthUser(req);
    
    // Step 2: Check if it's an error response
    if (authResult instanceof NextResponse) {
      return authResult;  // Return 401 error
    }
    
    // Step 3: Now we have the user data safely
    const user = authResult;  // { id: "123", role: "student" }

    // Step 4: Get pagination parameters from URL
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");

    // Step 4: Connect to database
    await connectDB();

    // Step 5: Load all designs for this user
    // sort({ createdAt: -1 }) = newest first
    // lean() = convert Mongoose docs to plain JS objects (faster)
    const designs = await Design.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .skip((page -1)*limit)
      .limit(limit)
      .lean();

          // Get total count for pagination
    const total = await Design.countDocuments({ userId: user.id });

        // Step 6: Return user's designs with pagination
    return NextResponse.json({ 
      success: true,
      designs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    // ✅ PROPER ERROR HANDLING
    console.error("Load designs error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Server error while loading designs" }, 
      { status: 500 }
    );
  }
}
