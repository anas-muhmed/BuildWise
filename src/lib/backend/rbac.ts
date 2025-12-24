// src/lib/backend/rbac.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "./auth";

export type UserRole = "student" | "teacher" | "admin";

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Middleware to enforce role-based access control
 * Call this at the start of protected API routes
 */
export function requireRole(req: NextRequest, allowedRoles: UserRole[]): AuthUser {
  const authUser = getAuthUserFromRequest(req);
  
  if (!authUser) {
    throw new Error("Unauthorized: No valid authentication");
  }
  
  const userRole = (authUser as { role?: string }).role as UserRole || "student";
  
  if (!allowedRoles.includes(userRole)) {
    throw new Error(`Forbidden: Role ${userRole} not allowed. Required: ${allowedRoles.join(", ")}`);
  }
  
  return {
    userId: authUser.userId,
    email: authUser.email,
    role: userRole
  };
}

/**
 * Helper for common RBAC patterns
 */
export function isAdmin(req: NextRequest): boolean {
  try {
    const authUser = getAuthUserFromRequest(req);
    return (authUser as { role?: string })?.role === "admin";
  } catch {
    return false;
  }
}

export function isTeacher(req: NextRequest): boolean {
  try {
    const authUser = getAuthUserFromRequest(req);
    const role = (authUser as { role?: string })?.role;
    return role === "teacher" || role === "admin";
  } catch {
    return false;
  }
}

/**
 * Response helpers for RBAC errors
 */
export function unauthorizedResponse(message = "Unauthorized"): NextResponse {
  return NextResponse.json(
    { ok: false, error: message },
    { status: 401 }
  );
}

export function forbiddenResponse(message = "Forbidden"): NextResponse {
  return NextResponse.json(
    { ok: false, error: message },
    { status: 403 }
  );
}
