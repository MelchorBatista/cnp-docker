/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// query.ts

import express from 'express';
import { solicitarAcceso } from '../controllers/queryController';

const router = express.Router();

// Ruta para ejecutar consultas dinámicas (usando la función solicitarAcceso)
router.post('/execute', solicitarAcceso);

export default router;
