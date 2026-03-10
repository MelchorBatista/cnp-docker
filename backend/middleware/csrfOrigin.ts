import { Request, Response, NextFunction } from 'express';

/**
 * Middleware CSRF por Origin:
 * - Permite una lista de orígenes configurables (CSRF_ORIGINS / CORS_ORIGINS / FRONTEND_URL)
 * - Normaliza esquemas/host/puerto removiendo slash final.
 * - Si no hay header Origin, permite continuar (requests same-origin/no-browser).
 */
const normalizeOrigin = (value: string): string => value.trim().replace(/\/+$/, '').toLowerCase();

const collectAllowedOrigins = (): Set<string> => {
  const raw = [
    process.env.CSRF_ORIGINS,
    process.env.CORS_ORIGINS,
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]
    .filter(Boolean)
    .join(',');

  const values = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizeOrigin);

  return new Set(values);
};

const allowedOrigins = collectAllowedOrigins();

export default function csrfOrigin(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  if (!origin) {
    next();
    return;
  }

  if (!allowedOrigins.has(normalizeOrigin(origin))) {
    res.status(403).json({ error: 'Origen no permitido.' });
    return;
  }

  next();
}
