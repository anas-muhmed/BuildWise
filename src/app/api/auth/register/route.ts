// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/backend/mongodb";
import { User } from "@/lib/backend/models/User";
import { signToken } from "@/lib/backend/auth";

export async function POST(req: Request) {
  try {
    // Step 1: Parse incoming JSON body
    const body = await req.json();
    const { name, email, password } = body;

    // Step 2: Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing fields" }, 
        { status: 400 }
      );
    }

    // Step 3: Connect to database
    await connectDB();

    // Step 4: Check if email already exists
    const exists = await User.findOne({ email });
    if (exists) {
      return NextResponse.json(
        { error: "Email already used" }, 
        { status: 409 }
      );
    }

    // Step 5: Hash password (NEVER store plain text!)
    const hashed = await bcrypt.hash(password, 10);

    // Step 6: Create user in database
    const user = await User.create({ 
      name, 
      email, 
      password: hashed 
    });

    // Step 7: Generate JWT token
    const token = signToken({ 
      id: user._id.toString(), 
      role: user.role 
    });

    // Step 8: Return success response
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
    console.error("Registration error:", error);
    
    // Type guard: Check if error has message property
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }
    
    // Fallback for unknown error types
    return NextResponse.json(
      { error: "Server error" }, 
      { status: 500 }
    );
  }
}
