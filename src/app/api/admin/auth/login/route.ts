import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { Admin } from "@/lib/backend/models/Admin";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/backend/auth";

export async function POST(req: NextRequest) {
  try {
    const{email,password}=await req.json();
    if(!email||!password){
        return NextResponse.json(
            {error:"Email and password required "},
            {status:400}
        );
    }

        await connectDB();

        const admin=await Admin.findOne({email});
        if(!admin){
            return NextResponse.json(
                 { error: "Invalid credentials" },
        { status: 401 }
            )
        }
         

        //verify password
        const isMatch=await bcrypt.compare(password,admin.password);
        if(!isMatch){
            return NextResponse.json(
                { error: "Invalid credentials" },
        { status: 401 }
            )
        }

        //create jwt token
        const token=signToken(
           { userId: admin._id?.toString()||admin.id, role: "admin", email: admin.email },
      "7d"
        )

            return NextResponse.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
    }  catch (error) {
    console.error("Admin login error:", error);
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