/**
 * Simple in-memory rate limiting implementation
 * 
 * Tracks request counts per IP address with time-based windows.
 * Automatically cleans up expired entries to prevent memory leaks.
 * 
 * @module rateLimit
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimitStore {
  [key: string]: RateLimitRecord;
}

const store: RateLimitStore = {};

/**
 * Rate limit checker
 * 
 * Implements sliding window rate limiting per IP address.
 * Returns whether the request should be allowed and remaining quota.
 * 
 * @param {string} identifier - Unique identifier (usually IP address)
 * @param {number} maxRequests - Maximum requests allowed in time window (default: 5)
 * @param {number} windowMs - Time window in milliseconds (default: 3600000 = 1 hour)
 * @returns {Object} Rate limit result
 * @returns {boolean} allowed - Whether request should be allowed
 * @returns {number} remaining - Number of requests remaining in window
 * @returns {number} resetTime - Timestamp when limit resets
 * 
 * @example
 * const { allowed, remaining } = rateLimit('192.168.1.1', 5, 3600000);
 * if (!allowed) {
 *   return new Response('Too many requests', { status: 429 });
 * }
 */
export function rateLimit(
  identifier: string,
  maxRequests = 5,
  windowMs = 3600000 // 1 hour default
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = store[identifier];

  // No record or window expired - create new record
  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs;
    store[identifier] = { count: 1, resetTime };
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }

  // Limit exceeded
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  // Increment count
  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Cleanup old rate limit records
 * 
 * Removes expired entries from the store to prevent memory leaks.
 * Should be called periodically (e.g., via setInterval).
 * 
 * @returns {number} Number of records cleaned up
 */
export function cleanupRateLimitStore(): number {
  const now = Date.now();
  let cleaned = 0;

  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
      cleaned++;
    }
  });

  return cleaned;
}

// Automatic cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = cleanupRateLimitStore();
    if (cleaned > 0) {
      console.log(`[RateLimit] Cleaned up ${cleaned} expired records`);
    }
  }, 600000); // 10 minutes
}
