// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/backend/mongodb";
import { User } from "@/lib/backend/models/User";
import { signToken } from "@/lib/backend/auth";

export async function POST(req: Request) {
  try {
    // Step 1: Parse credentials
    const body = await req.json();
    const { email, password } = body;

    // Step 2: Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" }, 
        { status: 400 }
      );
    }

    // Step 3: Connect to database
    await connectDB();

    // Step 4: Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" }, 
        { status: 401 }
      );
    }

    // Step 5: Compare password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" }, 
        { status: 401 }
      );
    }

    // Step 6: Generate JWT token
    const token = signToken({ 
      id: user._id.toString(), 
      role: user.role 
    });

    // Step 7: Return success response
    return NextResponse.json({ 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email 
      }, 
      token 
    });

  } catch (error) {
    // ✅ PROPER ERROR HANDLING (No 'any'!)
    console.error("Login error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Server error" }, 
      { status: 500 }
    );
  }
}