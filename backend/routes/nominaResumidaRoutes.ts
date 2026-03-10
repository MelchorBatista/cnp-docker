/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// backend/routes/nominaResumidaRoutes.ts
import { Router } from 'express';
import auth from '../middleware/auth';
import capturarIP from '../middleware/capturarIP';
import { getNominaResumida } from '../controllers/nominaResumidaController';
import { generarReporteNominaResumidaPdf } from '../controllers/reporteNominaResumidaController';

const router = Router();

/**
 * JSON:
 *   GET /api/nomina-resumida/:anio/:mes
 *   Query opcional:
 *     - organismoId: number  → filtra por organismo
 *     - poder: string        → filtra por poder del estado (EJECUTIVO|LEGISLATIVO|JUDICIAL|LOCAL|AUTONOMO)
 */
router.get('/:anio/:mes', auth, capturarIP, getNominaResumida);

/**
 * PDF:
 *   GET /api/nomina-resumida/pdf/:anio/:mes
 *   (El controlador de PDF puede aceptar los mismos filtros si se requiere)
 */
router.get('/pdf/:anio/:mes', auth, capturarIP, generarReporteNominaResumidaPdf);

export default router;
