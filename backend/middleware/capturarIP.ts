/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// capturarIP.ts

import { Request, Response, NextFunction } from 'express';

interface CustomRequest extends Request {
  direccionIP?: string;
}

const capturarIP = (req: CustomRequest, res: Response, next: NextFunction): void => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    req.direccionIP = forwarded.split(/, /)[0];
  } else if (Array.isArray(forwarded)) {
    req.direccionIP = forwarded[0];
  } else {
    req.direccionIP = req.socket?.remoteAddress || (req.connection && req.connection.remoteAddress);
  }
  next();
};

export default capturarIP;
