/**
 * Rate Limiter for AI Endpoints
 * 
 * Purpose: Prevent API abuse and cost explosion when using real AI
 * 
 * Simple in-memory rate limiter:
 * - Tracks requests per user per time window
 * - Configurable limits per endpoint
 * - Graceful degradation (logs but doesn't fail if user not found)
 * 
 * Production upgrade path:
 * - Redis for distributed rate limiting
 * - Per-user quotas from database
 * - Different limits for different user tiers
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RequestRecord {
  timestamps: number[];
}

// In-memory store: userId -> request timestamps
const requestStore = new Map<string, RequestRecord>();

// Rate limit configurations by endpoint type
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "student-architecture": {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute (aggressive for testing)
  },
  "manual-analysis": {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute (manual design is lighter)
  },
  "generative-architecture": {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute (most expensive)
  },
};

/**
 * Check if request is within rate limit
 * 
 * @param userId - User identifier (JWT sub, IP address, etc.)
 * @param endpoint - Endpoint identifier for rate limit config
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  userId: string,
  endpoint: keyof typeof RATE_LIMITS
): { allowed: boolean; remaining: number; resetAt: number; limit: number } {
  const config = RATE_LIMITS[endpoint];
  
  if (!config) {
    console.warn(`No rate limit config for endpoint: ${endpoint}`);
    return { allowed: true, remaining: 999, resetAt: Date.now(), limit: 999 };
  }

  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Get or create user record
  let record = requestStore.get(userId);
  if (!record) {
    record = { timestamps: [] };
    requestStore.set(userId, record);
  }

  // Remove timestamps outside current window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  // Check if limit exceeded
  const currentCount = record.timestamps.length;
  const allowed = currentCount < config.maxRequests;

  if (allowed) {
    // Record this request
    record.timestamps.push(now);
  }

  // Calculate reset time (when oldest request exits window)
  const oldestTimestamp = record.timestamps[0] || now;
  const resetAt = oldestTimestamp + config.windowMs;

  return {
    allowed,
    remaining: Math.max(0, config.maxRequests - currentCount - (allowed ? 1 : 0)),
    resetAt,
    limit: config.maxRequests,
  };
}

/**
 * Cleanup old records (call periodically to prevent memory leak)
 * Remove users with no requests in last 10 minutes
 */
export function cleanupRateLimiter() {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutes

  for (const [userId, record] of requestStore.entries()) {
    const hasRecentActivity = record.timestamps.some((ts) => now - ts < maxAge);
    if (!hasRecentActivity) {
      requestStore.delete(userId);
    }
  }

  console.log(`Rate limiter cleanup: ${requestStore.size} active users`);
}

// Auto-cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimiter, 5 * 60 * 1000);
}

/**
 * Get rate limit identifier from request
 * Priority: JWT user ID > IP address > anonymous
 */
export function getRateLimitIdentifier(
  userId: string | null,
  ipAddress: string | null
): string {
  if (userId) return `user:${userId}`;
  if (ipAddress) return `ip:${ipAddress}`;
  return "anonymous";
}
