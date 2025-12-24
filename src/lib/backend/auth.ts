// lib/backend/auth.ts
import jwt from "jsonwebtoken";

// Get JWT secret from environment (fail fast if missing)
const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET missing in .env.local");
}

/**
 * Creates a JWT token with user data
 * @param payload - Data to store in token (user ID, role, etc.)
 * @param expiresIn - How long token is valid (default: 30 days)
 * @returns Signed JWT token string
 */
export function signToken(payload: object, expiresIn = process.env.JWT_EXPIRES_IN || "30d") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, JWT_SECRET, { expiresIn, issuer: process.env.JWT_ISSUER || "buildwise" } as any);
}

/**
 * Verifies and decodes a JWT token
 * @param token - JWT token string
 * @returns Decoded payload if valid, null if invalid/expired
 */
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;  // Token invalid or expired
  }
}

export type AuthUser = {
  userId: string;
  role: "admin" | "teacher" | "student" | "guest" | string;
  email?: string;
  iat?: number;
  exp?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: any;
};

const ISSUER = process.env.JWT_ISSUER || "buildwise";

/**
 * Parse and verify JWT from Authorization header: 'Bearer <token>'
 * Returns AuthUser on success or null on invalid token.
 */
export function getAuthUserFromRequest(req: Request): AuthUser | null {
  try {
    // Node fetch Request has headers.get
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const headers = (req as any).headers;
    const getHeader = (name: string) => {
      if (typeof headers.get === "function") return headers.get(name);
      return headers[name];
    };

    const auth = getHeader("authorization") || getHeader("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) return null;

    const token = auth.split(" ")[1];
    if (!token) return null;

    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: ISSUER,
      // audience optional — set if using JWT_AUD
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    // minimal shape: { userId, role, email, iat, exp }
    // Reject old tokens that don't have userId field
    if (!payload.userId && !payload.sub && !payload.uid) {
      return null; // Will be caught by requireAuthOrThrow
    }

    const user: AuthUser = {
      userId: payload.userId || payload.sub || payload.uid || "",
      role: payload.role || "student",
      email: payload.email,
      iat: payload.iat,
      exp: payload.exp,
      ...payload
    };

    return user;
  } catch {
    // invalid token => null (route should reject)
    return null;
  }
}

/**
 * Guard: throw if no authenticated user
 */
export function requireAuthOrThrow(req: Request) {
  const user = getAuthUserFromRequest(req);
  if (!user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e: any = new Error("Unauthorized: valid Bearer token required");
    e.status = 401;
    throw e;
  }
  return user;
}

/**
 * Guard: require specific role(s)
 */
export function requireRoleOrThrow(req: Request, allowed: string[] = ["admin"]) {
  const user = requireAuthOrThrow(req);
  if (!allowed.includes(user.role)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e: any = new Error("Forbidden: insufficient privileges");
    e.status = 403;
    throw e;
  }
  return user;
}

/**
 * Legacy header-based auth for backward compatibility (dev only)
 * @deprecated Use getAuthUserFromRequest instead
 */
export function getAuthUserFromHeader(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const headers = (req as any).headers || {};
  const get = (name: string) =>
    typeof headers.get === "function" ? headers.get(name) : (headers[name] as string | undefined);
  const userId = get("x-user-id") || "anonymous";
  const role = get("x-user-role") || "student";
  return { userId, role };
}

/**
 * @deprecated Use requireRoleOrThrow instead
 */
export function requireAdminOrThrow(req: Request) {
  return requireRoleOrThrow(req, ["admin", "teacher"]);
}