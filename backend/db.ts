/**
 * Ministerio de Administracion Publica (MAP)
 * Portal para Informacion Complementaria de Nominas Publicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sanchez Perez
 * Coordinador: Lucas Almonte
 */
// db.ts

export { connectRecepcion, sql as sqlRecepcion } from './config/connectRecepcion';
export { connectValidacion, sql as sqlValidacion } from './config/connectValidacion';
export { connectConsulta, sql as sqlConsulta } from './config/connectConsulta';