import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Strict rate limiter for authentication to prevent brute force attacks
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Only 5 attempts per 15 minutes per IP
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  message: 'Too many authentication attempts, please try again later.',
});

export const validateSecret = (req: Request, res: Response, next: NextFunction) => {
  const secret = req.header('X-API-Secret') || req.header('Authorization')?.replace('Bearer ', '');

  const validSecret = process.env.API_SECRET;
  if (!validSecret) {
    console.error('API_SECRET is not defined in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  if (!secret || secret !== validSecret) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  next();
};
