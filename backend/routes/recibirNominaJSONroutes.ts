/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// rnp/backend/routes/recibirNominaJSONroutes.ts

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { io } from '../server';
import { RecibirNominaJSON } from '../controllers/RecibirNominaJSONcontroller';
import auth from '../middleware/auth';
import capturarIP from '../middleware/capturarIP';
import { registrarAuditoria } from '../middleware/audit'; // ← NUEVO

const router = Router();

router.post('/', auth, capturarIP, async (req, res) => {
  const totalSizeHeader = req.headers['content-length'];
  if (!totalSizeHeader) {
    res.status(400).json({ message: 'No se proporcionó un archivo válido.' });
    return;
  }
  const totalSize = parseInt(totalSizeHeader.toString(), 10);
  let uploadedSize = 0;

  const user = req.user!;
  const ip = (req as any).direccionIP ?? '0.0.0.0';

  // Nombre del archivo desde header personalizado, o generado
  const fileName = req.headers['x-file-name']?.toString() || `${Date.now()}-uploaded.json`;
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }
  const filePath = path.join(uploadDir, fileName);
  const fileStream = fs.createWriteStream(filePath);

  req.on('data', (chunk: Buffer) => {
    uploadedSize += chunk.length;
    const progress = (uploadedSize / totalSize) * 100;
    io.emit('upload-progress', progress);
  });

  req.pipe(fileStream);

  req.on('end', async () => {
    // Registrar auditoría antes de ejecutar el procesamiento
    try {
      await registrarAuditoria(
        user.id,
        'Cargar JSON',
        'RecepcionNomina',
        `Archivo cargado: ${fileName} (${(totalSize / 1024).toFixed(1)} KB)`,
        ip,
        user.email,
      );
    } catch (error) {
      console.error('⚠️ No se pudo registrar auditoría de carga:', error);
    }

    // Simular propiedad req.file para el controlador
    req.file = { filename: fileName } as any;
    RecibirNominaJSON(req, res);
  });

  req.on('error', (err: Error) => {
    res.status(500).json({ message: 'Error al procesar el archivo.', error: err.message });
  });
});

export default router;
