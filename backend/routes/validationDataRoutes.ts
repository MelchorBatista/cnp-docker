// rnp/backend/routes/validationDataRoutes.ts
//---------------------------------------------------
//  Rutas para catálogos de validación
//  • GET  /api/validation           → JSON en claro (uso interno)
//  • POST /api/validation/encrypt   → JSON cifrado (AES-256-GCM)
//---------------------------------------------------
import express from 'express';
import { loadValidationData } from '../services/validationDataService';

import auth from '../middleware/auth';
import csrfOrigin from '../middleware/csrfOrigin';

import { encrypt as encryptValidation } from '../controllers/validationEncryptController'; // ← NUEVO

const router = express.Router();

/*────────────────────────────────────────────────────
  GET /api/validation
  Devuelve los catálogos sin cifrar — solo para
  llamadas internas o debugging (requiere JWT).
────────────────────────────────────────────────────*/
router.get('/', auth, async (_req, res) => {
  try {
    const cachedData = await loadValidationData();
    res.json(cachedData);
  } catch (error: any) {
    console.error('❌ Error en GET /api/validation:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/*────────────────────────────────────────────────────
  POST /api/validation/encrypt
  Body (raw, 32 B) : uuidKey
  Respuesta        : { iv, cipher, tag } base64url
────────────────────────────────────────────────────*/
router.post(
  '/encrypt',
  auth, // debe haber JWT
  csrfOrigin, // Origin debe coincidir
  express.raw({ type: '*/*', limit: '64kb' }), // cuerpo binario
  encryptValidation, // ► controlador con TTL y uso-único
);

export default router;
