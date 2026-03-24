import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiting per tenant
// In production, use Redis-based rate limiting
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
}

/**
 * Rate Limiting Middleware
 * Rate limiting per tenant to prevent abuse
 */
export const rateLimiter = (config: RateLimitConfig) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Use tenant ID if available, otherwise use IP
    const key = req.tenantContext?.tenantId || req.ip || 'anonymous';
    const now = Date.now();

    let record = rateLimitStore.get(key);

    // Reset if window has passed
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + config.windowMs,
      };
    }

    record.count++;
    rateLimitStore.set(key, record);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.max - record.count));
    res.setHeader('X-RateLimit-Reset', record.resetTime);

    if (record.count > config.max) {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
        },
      });
      return;
    }

    next();
  };
};

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);
