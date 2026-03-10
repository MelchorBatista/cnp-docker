/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// backend/routes/reporteNominaRoutes.ts
import { Router } from 'express';
import auth from '../middleware/auth';
import capturarIP from '../middleware/capturarIP';
import * as ctrl from '../controllers/reporteNominaController';

const router = Router();

// Todas las rutas requieren JWT
router.use(auth);

// Obtener organismos únicos
router.get('/organismos', ctrl.getReporteNominaOrganismos);

// Obtener datos de nómina por organismo, año y mes
router.get('/por-mes', capturarIP, ctrl.getReporteNominaPorMes);

// Generar y descargar PDF
router.get('/pdf', capturarIP, ctrl.generarReporteNominaPdf);

export default router;
