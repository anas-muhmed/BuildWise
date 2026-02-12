/**
 * Admin Users API
 * 
 * Purpose: User management for admin
 * 
 * GET: List all users
 * PATCH: Update user (promote/demote, activate/deactivate)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/backend/adminMiddleware";
import { connectDB } from "@/lib/backend/db";
import { User } from "@/lib/backend/models/User";

export async function GET(req: NextRequest) {
  const authCheck = requireAdmin(req);
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    await connectDB();

    const users = await User.find()
      .select("-password") // Don't send passwords
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const authCheck = requireAdmin(req);
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    await connectDB();

    const { userId, updates } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId required" },
        { status: 400 }
      );
    }

    // Only allow specific fields to be updated
    const allowedUpdates: any = {};
    if (updates.role && ["student", "admin", "teacher", "guest"].includes(updates.role)) {
      allowedUpdates.role = updates.role;
    }
    if (typeof updates.isActive === "boolean") {
      allowedUpdates.isActive = updates.isActive;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: allowedUpdates },
      { new: true, select: "-password" }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error("Admin user update error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
