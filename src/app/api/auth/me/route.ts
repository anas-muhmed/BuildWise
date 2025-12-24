// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/backend/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }
    // return minimal safe profile
    return NextResponse.json({
      ok: true,
      user: {
        userId: user.userId,
        role: user.role,
        email: user.email || null
      }
    });
  } catch (err) {
    console.error("GET /api/auth/me error", err);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
