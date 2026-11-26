import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const windowMs = 60 * 1000;
const maxRequests = 100;
const hits = new Map<string, RateLimitEntry>();

export function rateLimiter(_request: Request, response: Response, next: NextFunction): void {
  const ip = _request.ip ?? _request.socket?.remoteAddress ?? 'unknown';
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now >= entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (entry.count >= maxRequests) {
    response.status(429).type('text').send('Muitas requisições. Tente novamente em breve.');
    return;
  }

  entry.count += 1;
  next();
}
