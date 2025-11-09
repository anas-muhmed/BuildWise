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
 * @param expiresIn - How long token is valid (default: 7 days)
 * @returns Signed JWT token string
 */
export function signToken(payload: object, expiresIn: string = process.env.JWT_EXPIRES_IN || "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
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