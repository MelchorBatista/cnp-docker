/**
 * Ministerio de Administracion Publica (MAP)
 * Portal para Informacion Complementaria de Nominas Publicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sanchez Perez
 * Coordinador: Lucas Almonte
 */
// rnp/backend/config/connectValidacion.ts
import { obtenerConfiguracionValidacion } from './configuracionBases';

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

let poolValidacion: CustomConnectionPool | undefined;
const configuracionValidacion = obtenerConfiguracionValidacion();
const sql = configuracionValidacion.sql;

export const connectValidacion = async (): Promise<CustomConnectionPool> => {
  try {
    if (poolValidacion) {
      if (!poolValidacion.connected) {
        await poolValidacion.connect();
      }
      return poolValidacion;
    }

    poolValidacion = new sql.ConnectionPool(configuracionValidacion.configuracion as any) as any as CustomConnectionPool;
    await poolValidacion.connect();

    console.log(
      `[VALIDACION] Conexion establecida. Servidor=${configuracionValidacion.servidor} Base=${configuracionValidacion.baseDatos} Auth=${configuracionValidacion.modoAutenticacion}`,
    );
    return poolValidacion;
  } catch (error) {
    console.error('[VALIDACION] Error de conexion:', error instanceof Error ? error.message : error);
    throw error;
  }
};

export const getPoolValidacion = async (): Promise<CustomConnectionPool> => {
  if (poolValidacion && poolValidacion.connected) return poolValidacion;
  return connectValidacion();
};

export async function getValidationData(): Promise<{
  organismos: any[];
  nivelGobierno: any[];
  tiposEmpleados: any[];
  catalogo: any[];
  cargo: any[];
  categoriaEmpleados: any[];
}> {
  const pool = await connectValidacion();

  const organismosPromise = pool.request().query('SELECT OrganismoID, Nombre, Vigente FROM organismos');
  const nivelGobiernoPromise = pool.request().query('SELECT NivelGobiernoID, Descripcion FROM nivelGobierno');
  const tiposEmpleadosPromise = pool.request().query('SELECT Tipo_Empleado, Descripcion FROM Tipos_Empleados');
  const catalogoPromise = pool.request().query('SELECT ID, DESCRIPCION FROM CATALOGO');
  const cargoPromise = pool.request().query('SELECT CargoID, Descripcion FROM Cargo');
  const categoriaEmpleadosPromise = pool
    .request()
    .query('SELECT Categoria_Empleado, Descripcion FROM Categoria_Empleados');

  const [
    organismosResult,
    nivelGobiernoResult,
    tiposEmpleadosResult,
    catalogoResult,
    cargoResult,
    categoriaEmpleadosResult,
  ] = await Promise.all([
    organismosPromise,
    nivelGobiernoPromise,
    tiposEmpleadosPromise,
    catalogoPromise,
    cargoPromise,
    categoriaEmpleadosPromise,
  ]);

  return {
    organismos: organismosResult.recordset,
    nivelGobierno: nivelGobiernoResult.recordset,
    tiposEmpleados: tiposEmpleadosResult.recordset,
    catalogo: catalogoResult.recordset,
    cargo: cargoResult.recordset,
    categoriaEmpleados: categoriaEmpleadosResult.recordset,
  };
}

export { sql };
