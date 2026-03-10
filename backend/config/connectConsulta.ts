/**
 * Ministerio de Administracion Publica (MAP)
 * Portal para Informacion Complementaria de Nominas Publicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sanchez Perez
 * Coordinador: Lucas Almonte
 */
// backend/config/connectConsulta.ts

import { obtenerConfiguracionConsulta } from './configuracionBases';

interface CustomRequest {
  input: (name: string, type: any, value: any) => CustomRequest;
  query: (query: string) => Promise<{ recordset: any[] }>;
}

interface CustomConnectionPool {
  connected: boolean;
  connect: () => Promise<CustomConnectionPool>;
  close: () => Promise<void>;
  request: () => CustomRequest;
}

let poolConsulta: CustomConnectionPool | undefined;
const configuracionConsulta = obtenerConfiguracionConsulta();
const sql = configuracionConsulta.sql;

export const connectConsulta = async (): Promise<CustomConnectionPool> => {
  try {
    if (poolConsulta && poolConsulta.connected) {
      return poolConsulta;
    }

    poolConsulta = new sql.ConnectionPool(configuracionConsulta.configuracion as any) as any as CustomConnectionPool;
    await poolConsulta.connect();

    console.log(
      `[CONSULTA] Conexion establecida. Servidor=${configuracionConsulta.servidor} Base=${configuracionConsulta.baseDatos} Auth=${configuracionConsulta.modoAutenticacion}`,
    );
    return poolConsulta;
  } catch (error) {
    console.error('[CONSULTA] Error al conectar:', error instanceof Error ? error.message : error);
    throw error;
  }
};

export const getConexionConsulta = async (): Promise<CustomConnectionPool> => {
  if (poolConsulta && poolConsulta.connected) return poolConsulta;
  return connectConsulta();
};

export { sql };