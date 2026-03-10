/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// backend/routes/poderNominaResumidaRoutes.ts
import { Router } from 'express';
import auth from '../middleware/auth';
import capturarIP from '../middleware/capturarIP';
import { getNominaResumidaPorPoder } from '../controllers/poderNominaResumidaController';
import { generarReporteNominaResumidaPoderPdf } from '../controllers/reporteNominaResumidaPoderController';

const router = Router();

/**
 * JSON
 *   GET /api/nomina-resumida-poder/:anio/:mes?poder=<NOMBRE LARGO>
 *   donde <NOMBRE LARGO> ∈ {
 *     "PODER EJECUTIVO",
 *     "PODER LEGISLATIVO",
 *     "PODER JUDICIAL",
 *     "GOBIERNO LOCAL",
 *     "ORGANISMO AUTONOMO"
 *   }
 */
router.get('/:anio/:mes', auth, capturarIP, getNominaResumidaPorPoder);

/**
 * PDF
 *   GET /api/nomina-resumida-poder/pdf/:anio/:mes?poder=<NOMBRE LARGO>
 */
router.get('/pdf/:anio/:mes', auth, capturarIP, generarReporteNominaResumidaPoderPdf);

export default router;
