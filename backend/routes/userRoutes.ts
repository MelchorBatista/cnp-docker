/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// routes/userRoutes.ts
import { Router } from 'express';
import {
  solicitarAcceso,
  confirmarCorreo,
  getUsuarios,
  actualizarUsuario, // Asegúrate de haber importado actualizarUsuario
} from '../controllers/userController';
import { verifyToken } from '../middleware/auth'; // Importa el middleware de autenticación

const router = Router();

router.post('/solicitar-acceso', solicitarAcceso);
router.get('/confirmar-correo', confirmarCorreo);
router.get('/', getUsuarios);
// Agrega el middleware verifyToken para que req.user se establezca en actualizarUsuario
router.put('/:id', verifyToken, actualizarUsuario);

export default router;
