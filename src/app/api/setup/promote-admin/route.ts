/**
 * Setup API - Promote User to Admin
 * 
 * ⚠️ SECURITY: This endpoint is DISABLED in production
 * Only works if SETUP_MODE=true in environment
 * 
 * Usage: POST /api/setup/promote-admin
 * Body: { "email": "your@email.com", "secret": "SETUP_SECRET" }
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/db";
import { User } from "@/lib/backend/models/User";

export async function POST(req: NextRequest) {
  try {
    // 🔒 SECURITY: Block in production unless explicitly enabled
    const isSetupMode = process.env.SETUP_MODE === "true";
    const setupSecret = process.env.SETUP_SECRET;

    if (!isSetupMode) {
      return NextResponse.json(
        { error: "Setup mode disabled" },
        { status: 403 }
      );
    }

    const { email, secret } = await req.json();

    if (!email || !secret) {
      return NextResponse.json(
        { error: "Email and secret required" },
        { status: 400 }
      );
    }

    // 🔒 Verify setup secret
    if (secret !== setupSecret) {
      return NextResponse.json(
        { error: "Invalid secret" },
        { status: 401 }
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
  } catch (error: unknown) {
    console.error("Promote admin error:", error);
    return NextResponse.json(
      { error: "Failed to promote user" },
      { status: 500 }
    );
  }
}
