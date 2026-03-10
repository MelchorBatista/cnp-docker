/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// routes/protectedRoutes.ts

import express, { Request, Response } from 'express';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = express.Router();

/**
 * Ruta protegida: Perfil del usuario
 * Solo accesible para usuarios con rol "Administrador" o "Usuario"
 */
router.get('/perfil', verifyToken, requireRole(['Administrador', 'Usuario']), (req: Request, res: Response) => {
  res.json({
    message: 'Acceso concedido a ruta protegida: perfil del usuario',
    user: req.user,
  });
});

/**
 * Ruta protegida: Solo para administradores
 */
router.get('/admin', verifyToken, requireRole(['Administrador']), (req: Request, res: Response) => {
  res.json({
    message: 'Acceso concedido a ruta protegida para administradores',
    user: req.user,
  });
});

export default router;
