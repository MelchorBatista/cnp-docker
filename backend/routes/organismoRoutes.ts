/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// routes/organismoRoutes.ts
import { Router } from 'express';
import { getOrganismos } from '../controllers/organismoController';

const router = Router();

// Endpoint para obtener la lista de organismos (lectura, sin auditoría)
router.get('/', getOrganismos);

export default router;
