import type { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Every limiter gets its OWN store. A single shared map would mean the strict
 * auth limiter and the general limiter increment the same per-IP counter, so
 * ordinary browsing would spend the login budget and lock people out of
 * signing in.
 *
 * ponytail: in-memory, single-process. Swap for a Redis store before running
 * more than one API instance.
 */
const stores: Map<string, RateLimitEntry>[] = [];

// Clean up expired entries every 5 minutes
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const store of stores) {
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }
}, 5 * 60 * 1000);

// Never hold the process open just for the sweeper.
sweeper.unref?.();

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export const createRateLimiter = (options: RateLimitOptions = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // 100 requests per window
    message = "Too many requests, please try again later.",
    keyGenerator = (req: Request) => req.ip || req.socket.remoteAddress || "unknown",
  } = options;

  const rateLimitStore = new Map<string, RateLimitEntry>();
  stores.push(rateLimitStore);

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - entry.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetTime / 1000));

    if (entry.count > max) {
      res.status(429).json({
        message,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
};

// Default rate limiter. A single storefront page view fans out into several
// API calls, so this has to leave room for real browsing, not just one request
// per page.
export const rateLimiter = createRateLimiter({ max: 300 });

// Stricter rate limiter for auth endpoints
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 min window (login/register)
  message: "Too many authentication attempts, please try again later.",
});

// Rate limiter for API endpoints
export const apiRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
});
