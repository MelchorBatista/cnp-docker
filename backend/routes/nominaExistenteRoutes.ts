/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// backend/routes/nominaExistenteRoutes.ts

import { Router } from 'express';
import auth from '../middleware/auth';
import { checkNominaExistente, deleteNominaExistente } from '../controllers/nominaExistenteController';

const router = Router();

// ── GET /api/nomina/existe?anio=&mes=&org=
router.get('/existe', auth, checkNominaExistente);

// ── DELETE /api/nomina
router.delete('/', auth, deleteNominaExistente);

export default router;
