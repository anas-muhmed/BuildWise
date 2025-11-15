// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { User } from "@/lib/backend/models/User";
import { requireAuth } from "@/lib/backend/authMiddleware";

export async function GET(req: Request) {
  try {
    // Step 1: Authenticate user (using middleware!)
    const authResult = requireAuth(req);
    
    // Step 2: Check if it's an error response
    if (authResult instanceof NextResponse) {
      return authResult;  // Return 401 error
    }
    
    // Step 3: Now we have the user data safely
    const user = authResult;  // { id: "123", role: "student" or "admin" }
    
    // Step 4: Check if user is admin (ROLE-BASED ACCESS CONTROL)
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" }, 
        { status: 403 }
      );
    }

    // Step 5: Connect to database
    await connectDB();

    // Step 6: Get all users (exclude passwords for security!)
    // select("-password") = don't return password field
    // sort({ createdAt: -1 }) = newest users first
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    // Step 7: Return user list
    return NextResponse.json({ 
      success: true,
      users,
      count: users.length
    });

  } catch (error) {
    // ✅ PROPER ERROR HANDLING
    console.error("Admin users error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Server error while fetching users" }, 
      { status: 500 }
    );
  }
}
