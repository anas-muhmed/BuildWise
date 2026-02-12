/**
 * Admin Middleware
 * 
 * Purpose: Protect /admin/* routes from non-admin access
 * 
 * Simple check:
 * - User must be authenticated
 * - User must have role = "admin"
 * - Return 403 if not authorized
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "./auth";

/**
 * Check if user is admin
 * Returns true if user has admin role, false otherwise
 */
export function isAdmin(req: NextRequest): boolean {
  const user = getAuthUserFromRequest(req);
  return user?.role === "admin";
}

/**
 * Middleware wrapper for admin-only routes
 * Usage: const user = requireAdmin(req); if (!user) return unauthorized response;
 */
export function requireAdmin(req: NextRequest) {
  const user = getAuthUserFromRequest(req);
  
  if (!user) {
    return {
      authorized: false,
      error: "Authentication required",
      status: 401,
    };
  }

  if (user.role !== "admin") {
    return {
      authorized: false,
      error: "Admin access required",
      status: 403,
    };
  }

  return {
    authorized: true,
    user,
  };
}

/**
 * Helper to check if user has any elevated role (admin or teacher)
 */
export function hasElevatedAccess(req: NextRequest): boolean {
  const user = getAuthUserFromRequest(req);
  return user?.role === "admin" || user?.role === "teacher";
}
