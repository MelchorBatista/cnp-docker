/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// routes/auditRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * Ejemplo de endpoint de salud para esta ruta.
 * Importante: el handler devuelve void/Promise<void>, no Response.
 */
router.get('/ping', async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({ ok: true, service: 'audit' });
});

export default router;
