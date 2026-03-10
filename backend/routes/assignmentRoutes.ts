/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// /backend/routes/assignmentRoutes.ts

import { Router } from 'express';
import { getAssignments, addAssignment, removeAssignment } from '../controllers/assignmentController';

const router = Router();

router.get('/', getAssignments);
router.post('/', addAssignment);
// Actualizamos la ruta DELETE para que lea los datos desde req.body
router.delete('/', removeAssignment);

export default router;
