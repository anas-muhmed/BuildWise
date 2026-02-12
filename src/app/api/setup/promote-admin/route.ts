/**
 * Setup API - Promote User to Admin
 * 
 * TEMPORARY ENDPOINT FOR TESTING
 * Use this to make your first user an admin
 * 
 * Usage: POST /api/setup/promote-admin
 * Body: { "email": "your@email.com" }
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/db";
import { User } from "@/lib/backend/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update user role to admin
    user.role = "admin";
    await user.save();

    return NextResponse.json({
      success: true,
      message: `User ${user.name} (${user.email}) is now an admin`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Promote admin error:", error);
    return NextResponse.json(
      { error: "Failed to promote user" },
      { status: 500 }
    );
  }
}
