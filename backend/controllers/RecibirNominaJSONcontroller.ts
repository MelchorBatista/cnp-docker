/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// backend/controllers/RecibirNominaJSONcontroller.ts

/**
 * Descripcion: Controlador encargado de recibir archivos JSON de nomina y delegar su procesamiento.
 * Autor: Equipo CNP
 * Ultima modificacion: 2025-12-05
 */
import { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { procesarNominaJSON } from '../services/recibirNominaService';
import { registrarAuditoria } from '../middleware/audit';

const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void,
  ): void => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void): void => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

/**
 * Middleware de subida que almacena temporalmente el archivo recibido.
 */
export const RecibirNominaJSONMiddleware = multer({ storage }).single('file');

/**
 * Gestiona el flujo de recepcion de nominas JSON y dispara su procesamiento asincrono.
 * @param req Incluye el archivo y la IP utilizada para trazabilidad.
 * @param res Informa al cliente que el archivo fue aceptado o describe la falla.
 * @returns Promise<void>
 */
export const RecibirNominaJSON = async (req: Request, res: Response): Promise<void> => {
  const direccionIP = (req as any).direccionIP || req.ip;

  if (!req.file) {
    res.status(400).json({ mensaje: 'No se recibió ningún archivo.' });

    await registrarAuditoria(
      null,
      'ENVIO_NOMINA_FALLIDO',
      'Recepción de Nómina',
      'No se recibió ningún archivo.',
      direccionIP,
      '',
    );
    return;
  }

  const filePath = path.join(__dirname, '../uploads', req.file.filename);
  const taskId = uuidv4();

  res.status(202).json({
    taskId,
    mensaje: 'Archivo recibido. Procesamiento iniciado de forma asíncrona.',
  });

  process.nextTick(() => {
    fs.readFile(filePath, 'utf8', async (readErr, data) => {
      if (readErr) {
        console.error(`❌ [${taskId}] Error al leer archivo:`, readErr);

        await registrarAuditoria(
          null,
          'ENVIO_NOMINA_FALLIDO',
          'Recepción de Nómina',
          `Error leyendo el archivo: ${readErr.message}`,
          direccionIP,
          '',
        );
        return;
      }

      let nomina: any;
      try {
        nomina = JSON.parse(data);
      } catch (parseErr: any) {
        console.error(`❌ [${taskId}] JSON inválido:`, parseErr);

        await registrarAuditoria(
          null,
          'ENVIO_NOMINA_FALLIDO',
          'Recepción de Nómina',
          `JSON inválido: ${parseErr.message}`,
          direccionIP,
          '',
        );
        return;
      }

      try {
        await procesarNominaJSON(nomina);
        console.log(`✅ [${taskId}] Procesamiento completado.`);
      } catch (processErr: any) {
        console.error(`❌ [${taskId}] Fallo durante procesamiento:`, processErr);
        // Ya se registra auditoría en el servicio.
      }

      // fs.unlink(filePath, () => {});
    });
  });
};
