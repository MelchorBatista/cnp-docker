/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// routes/authRoutes.ts
import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { getUserStatus, loginUser, changePasswordReingreso } from '../controllers/authController';

/** Wrapper para handlers async que cumplan con RequestHandler (void | Promise<void>) */
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;
const asyncHandler = (fn: AsyncHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const router = Router();

/**
 * Consulta de estatus SIN validar clave.
 * - GET  /api/auth/status?username=correo@dominio
 * - POST /api/auth/status  { "username": "correo@dominio" }
 */
router.get(
  '/status',
  asyncHandler(async (req, res) => {
    await getUserStatus(req, res);
  }),
);
router.post(
  '/status',
  asyncHandler(async (req, res) => {
    await getUserStatus(req, res);
  }),
);

/**
 * Login reforzado:
 * - Bloquea si Estatus !== "Activado" (validación en el controlador)
 * - Solo si Estatus === "Activado" valida clave y emite JWT
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    await loginUser(req, res);
  }),
);

/**
 * Cambio de clave para flujo de REINGRESO:
 * - POST /api/auth/change-password  { username, newPassword }
 * - Cambia Clave y actualiza Estatus = 'Activado' si el usuario está en 'Reingreso'
 */
router.post(
  '/change-password',
  asyncHandler(async (req, res) => {
    await changePasswordReingreso(req, res);
  }),
);

export default router;
