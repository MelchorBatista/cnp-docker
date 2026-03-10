/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// routes/dashboardAuditRoutes.ts
import { Router } from 'express';
import { getDashboardAuditRecords } from '../controllers/dashboardAuditController';

const router = Router();

// Define el endpoint para obtener los registros del dashboard de auditoría
router.get('/dashboard-auditoria', getDashboardAuditRecords);

export default router;
