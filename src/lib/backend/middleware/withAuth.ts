// lib/backend/middleware/withAuth.ts
/**
 * Authentication middleware wrapper for API routes
 * 
 * Usage:
 *   export const POST = withAuth(async (req, user) => {
 *     // user is guaranteed to exist here
 *     return NextResponse.json({ ... });
 *   });
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest, AuthUser } from "../auth";

type AuthenticatedHandler = (
  req: NextRequest,
  user: AuthUser
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with authentication
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest) => {
    try {
      const user = getAuthUserFromRequest(req);

      if (!user) {
        return NextResponse.json(
          { error: "Unauthorized - valid Bearer token required" },
          { status: 401 }
        );
      }

      return await handler(req, user);
    } catch (error) {
      console.error("Auth middleware error:", error);
      
      if (error instanceof Error) {
        // Check for custom status code
        const status = (error as any).status || 500;
        return NextResponse.json(
          { error: error.message },
          { status }
        );
      }

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Wraps an API route handler with role-based authentication
 */
export function withRole(allowedRoles: string[]) {
  return (handler: AuthenticatedHandler) => {
    return withAuth(async (req, user) => {
      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: "Forbidden - insufficient privileges" },
          { status: 403 }
        );
      }

      return await handler(req, user);
    });
  };
}

/**
 * Admin-only route wrapper
 */
export const withAdmin = withRole(["admin"]);

/**
 * Teacher or Admin route wrapper
 */
export const withTeacher = withRole(["admin", "teacher"]);
