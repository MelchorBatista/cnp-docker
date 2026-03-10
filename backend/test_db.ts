/**
 * Ministerio de Administracion Publica (MAP)
 * Portal para Informacion Complementaria de Nominas Publicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sanchez Perez
 * Coordinador: Lucas Almonte
 */
// test_db.ts

import { connectRecepcion } from './config/connectRecepcion';
import { connectValidacion } from './config/connectValidacion';
import { connectConsulta } from './config/connectConsulta';

const testDB = async (): Promise<void> => {
  try {
    await connectRecepcion();
    await connectValidacion();
    await connectConsulta();

    console.log('Prueba de conexion exitosa a RECEPCION, VALIDACION y CONSULTA');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error al probar la conexion:', error.message);
    } else {
      console.error('Error al probar la conexion:', error);
    }
  }
};

testDB();