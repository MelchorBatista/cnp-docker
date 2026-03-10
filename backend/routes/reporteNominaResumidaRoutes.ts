/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// backend/routes/reporteNominaResumidaRoutes.ts
import { Router } from 'express';
import auth from '../middleware/auth';
import capturarIP from '../middleware/capturarIP';
import { generarReporteNominaResumidaPdf } from '../controllers/reporteNominaResumidaController';

const router = Router();

// GET /api/reporte-nomina-resumida/:anio/:mes → genera PDF resumido
router.get('/:anio/:mes', auth, capturarIP, generarReporteNominaResumidaPdf);

export default router;
