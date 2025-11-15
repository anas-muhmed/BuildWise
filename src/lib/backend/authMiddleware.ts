import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";

//TypeScript interface for JWT payload
export interface JWTPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

export function getAuthUser(
  req: NextRequest
): JWTPayload | NextResponse {
  //Step 1:Extract Authorization header
  const authHeader = req.headers.get("authorization") || "";

  //step 2:Check if Bearer token exists
  if (!authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized - No token provided" },
      { status: 401 }
    );
  }

  // Step 3: Extract token (remove "Bearer " prefix)
  const token = authHeader.split(" ")[1];

  // Step 4: Verify token with JWT secret
  const payload = verifyToken(token) as JWTPayload | null;

  // Step 5: Check if token is valid
  if (!payload || !payload.id) {
    return NextResponse.json(
      { error: "Unauthorized-Invalid token" },
      { status: 401 }
    );
  }

  // Step 6: Return validated user payload
  return payload;
}
