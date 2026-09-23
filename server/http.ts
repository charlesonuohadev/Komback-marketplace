import type { NextFunction, Request, RequestHandler, Response } from 'express';

export const asyncHandler =
  (fn: (req: any, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export function badRequest(res: Response, message: string, details?: unknown) {
  return res.status(400).json({ error: message, details });
}

export function notFound(res: Response, message = 'Resource not found') {
  return res.status(404).json({ error: message });
}

export function forbidden(res: Response, message = 'Not allowed') {
  return res.status(403).json({ error: message });
}

export function serverError(res: Response, message = 'Something went wrong') {
  return res.status(500).json({ error: message });
}

export function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

export function asInt(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(asString(value, ''), 10);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => asString(item)).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function asBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  return fallback;
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60) || 'item'
  );
}
