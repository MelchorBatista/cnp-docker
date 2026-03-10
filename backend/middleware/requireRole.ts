/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// middleware/requireRole.ts

import { Request, Response, NextFunction } from 'express';

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Se asume que el middleware verifyToken ya ha asignado req.user
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'No tiene permiso para acceder a este recurso' });
      return;
    }
    next();
  };
};
