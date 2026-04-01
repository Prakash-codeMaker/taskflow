/**
 * Rate Limiting Middleware
 * Separate limits for auth and general API routes
 */

const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'test',
  });
const generalLimiter = createLimiter(
  15 * 60 * 1000,
  100,
  'Too many requests, please try again after 15 minutes'
);

// Auth limiter: 10 attempts per 15 minutes
const authLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  'Too many authentication attempts, please try again after 15 minutes'
);

// Strict limiter for sensitive operations
const strictLimiter = createLimiter(
  60 * 60 * 1000,
  5,
  'Too many requests for this operation, please try again after 1 hour'
);

module.exports = { createLimiter, generalLimiter, authLimiter, strictLimiter };
