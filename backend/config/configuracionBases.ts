/**
 * Configuracion centralizada de las conexiones SQL del proyecto.
 * Define contratos separados para VALIDACION, CONSULTA y RECEPCION.
 */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const archivoEntorno = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';

function resolverRutaEntorno(nombreArchivo: string): string | undefined {
  const rutasCandidatas = [
    process.env.RUTA_ARCHIVO_ENTORNO,
    path.resolve(process.cwd(), nombreArchivo),
    path.resolve(__dirname, '..', nombreArchivo),
    path.resolve(__dirname, '..', '..', nombreArchivo),
  ].filter((ruta): ruta is string => typeof ruta === 'string' && ruta.trim() !== '');

  return rutasCandidatas.find((ruta) => fs.existsSync(ruta));
}

const rutaEntorno = resolverRutaEntorno(archivoEntorno);
if (rutaEntorno) {
  dotenv.config({ path: rutaEntorno });
}
else {
  dotenv.config();
}

type ModoAutenticacion = 'sql' | 'windows';
type ModuloSql = typeof import('mssql');

interface ConfiguracionPreparada {
  sql: ModuloSql;
  configuracion: Record<string, unknown>;
  modoAutenticacion: ModoAutenticacion;
  servidor: string;
  baseDatos: string;
}

interface OpcionesConexion {
  nombre: 'VALIDACION' | 'CONSULTA' | 'RECEPCION';
  claveModo: string;
  clavesServidor: string[];
  clavesBaseDatos: string[];
  clavesPuerto: string[];
  clavesUsuario: string[];
  clavesClave: string[];
  clavesEncrypt: string[];
  clavesTrust: string[];
  modoPredeterminado: ModoAutenticacion;
  permiteWindows: boolean;
}

function obtenerValorEntorno(...claves: string[]): string {
  for (const clave of claves) {
    const valor = process.env[clave];
    if (typeof valor === 'string' && valor.trim() !== '') {
      return valor.trim();
    }
  }

  return '';
}

function obtenerValorObligatorio(mensaje: string, ...claves: string[]): string {
  const valor = obtenerValorEntorno(...claves);
  if (!valor) {
    throw new Error(`${mensaje}. Claves revisadas: ${claves.join(', ')}`);
  }

  return valor;
}

function obtenerBooleanoEntorno(valor: string | undefined, valorPorDefecto: boolean): boolean {
  if (typeof valor !== 'string' || valor.trim() === '') {
    return valorPorDefecto;
  }

  return valor.trim().toLowerCase() === 'true';
}

function obtenerModoAutenticacion(clave: string, valorPorDefecto: ModoAutenticacion): ModoAutenticacion {
  const valor = (process.env[clave] || valorPorDefecto).trim().toLowerCase();
  return valor === 'windows' ? 'windows' : 'sql';
}

function cargarModuloSql(modoAutenticacion: ModoAutenticacion, nombreConexion: string): ModuloSql {
  if (modoAutenticacion === 'windows') {
    try {
      return require('mssql/msnodesqlv8') as ModuloSql;
    } catch {
      throw new Error(
        `Falta instalar msnodesqlv8 para usar autenticacion Windows en ${nombreConexion}. Ejecuta npm install msnodesqlv8 dentro de backend.`,
      );
    }
  }

  return require('mssql') as ModuloSql;
}

function prepararConfiguracion(opciones: OpcionesConexion): ConfiguracionPreparada {
  const modoAutenticacion = obtenerModoAutenticacion(opciones.claveModo, opciones.modoPredeterminado);
  if (modoAutenticacion === 'windows' && !opciones.permiteWindows) {
    throw new Error(`${opciones.nombre} solo admite autenticacion SQL.`);
  }

  const servidor = obtenerValorObligatorio(
    `No se definio el servidor SQL de ${opciones.nombre}`,
    ...opciones.clavesServidor,
  );
  const baseDatos = obtenerValorObligatorio(
    `No se definio la base de datos de ${opciones.nombre}`,
    ...opciones.clavesBaseDatos,
  );
  const puerto = parseInt(obtenerValorEntorno(...opciones.clavesPuerto) || '1433', 10);
  const cifrar = obtenerBooleanoEntorno(
    obtenerValorEntorno(...opciones.clavesEncrypt),
    obtenerBooleanoEntorno(process.env.SQL_ENCRYPT, false),
  );
  const confiarCertificado = obtenerBooleanoEntorno(
    obtenerValorEntorno(...opciones.clavesTrust),
    obtenerBooleanoEntorno(process.env.SQL_TRUST_SERVER_CERTIFICATE, true),
  );
  const sql = cargarModuloSql(modoAutenticacion, opciones.nombre);

  if (modoAutenticacion === 'windows') {
    return {
      sql,
      modoAutenticacion,
      servidor,
      baseDatos,
      configuracion: {
        server: servidor,
        database: baseDatos,
        port: puerto,
        driver: 'msnodesqlv8',
        options: {
          trustedConnection: true,
          trustServerCertificate: confiarCertificado,
          encrypt: cifrar,
        },
      },
    };
  }

  const usuario = obtenerValorObligatorio(
    `No se definio el usuario SQL de ${opciones.nombre}`,
    ...opciones.clavesUsuario,
  );
  const clave = obtenerValorObligatorio(
    `No se definio la clave SQL de ${opciones.nombre}`,
    ...opciones.clavesClave,
  );

  return {
    sql,
    modoAutenticacion,
    servidor,
    baseDatos,
    configuracion: {
      server: servidor,
      user: usuario,
      password: clave,
      database: baseDatos,
      port: puerto,
      options: {
        encrypt: cifrar,
        enableArithAbort: true,
        trustServerCertificate: confiarCertificado,
      },
    },
  };
}

export function obtenerNombreBaseValidacion(): string {
  return obtenerValorObligatorio('No se definio la base de datos VALIDACION', 'VALIDACION_DATABASE');
}

export function obtenerNombreBaseConsulta(): string {
  return obtenerValorObligatorio('No se definio la base de datos CONSULTA', 'CONSULTA_DATABASE', 'RECEPCION_DATABASE');
}

export function obtenerNombreBaseRecepcion(): string {
  return obtenerValorObligatorio('No se definio la base de datos RECEPCION', 'RECEPCION_DATABASE', 'DB_DATABASE');
}

export function obtenerConfiguracionValidacion(): ConfiguracionPreparada {
  return prepararConfiguracion({
    nombre: 'VALIDACION',
    claveModo: 'DB_AUTH_VALIDACION',
    clavesServidor: ['DB_SERVER_VALIDACION', 'DB_SERVER'],
    clavesBaseDatos: ['VALIDACION_DATABASE'],
    clavesPuerto: ['DB_PORT_VALIDACION', 'DB_PORT'],
    clavesUsuario: ['DB_USER_VALIDACION', 'DB_USER'],
    clavesClave: ['DB_PASSWORD_VALIDACION', 'DB_PASSWORD'],
    clavesEncrypt: ['SQL_ENCRYPT_VALIDACION', 'SQL_ENCRYPT'],
    clavesTrust: ['SQL_TRUST_SERVER_CERTIFICATE_VALIDACION', 'SQL_TRUST_SERVER_CERTIFICATE'],
    modoPredeterminado: 'sql',
    permiteWindows: true,
  });
}

export function obtenerConfiguracionConsulta(): ConfiguracionPreparada {
  return prepararConfiguracion({
    nombre: 'CONSULTA',
    claveModo: 'DB_AUTH_CONSULTA',
    clavesServidor: ['DB_SERVER_CONSULTA', 'DB_SERVER_RECEPCION', 'DB_SERVER'],
    clavesBaseDatos: ['CONSULTA_DATABASE', 'RECEPCION_DATABASE'],
    clavesPuerto: ['DB_PORT_CONSULTA', 'DB_PORT_RECEPCION', 'DB_PORT'],
    clavesUsuario: ['DB_USER_CONSULTA', 'DB_USER_RECEPCION', 'DB_USER'],
    clavesClave: ['DB_PASSWORD_CONSULTA', 'DB_PASSWORD_RECEPCION', 'DB_PASSWORD'],
    clavesEncrypt: ['SQL_ENCRYPT_CONSULTA', 'SQL_ENCRYPT_RECEPCION', 'SQL_ENCRYPT'],
    clavesTrust: ['SQL_TRUST_SERVER_CERTIFICATE_CONSULTA', 'SQL_TRUST_SERVER_CERTIFICATE_RECEPCION', 'SQL_TRUST_SERVER_CERTIFICATE'],
    modoPredeterminado: 'sql',
    permiteWindows: false,
  });
}

export function obtenerConfiguracionRecepcion(): ConfiguracionPreparada {
  return prepararConfiguracion({
    nombre: 'RECEPCION',
    claveModo: 'DB_AUTH_RECEPCION',
    clavesServidor: ['DB_SERVER_RECEPCION', 'DB_SERVER'],
    clavesBaseDatos: ['RECEPCION_DATABASE', 'DB_DATABASE'],
    clavesPuerto: ['DB_PORT_RECEPCION', 'DB_PORT'],
    clavesUsuario: ['DB_USER_RECEPCION', 'DB_USER'],
    clavesClave: ['DB_PASSWORD_RECEPCION', 'DB_PASSWORD'],
    clavesEncrypt: ['SQL_ENCRYPT_RECEPCION', 'SQL_ENCRYPT'],
    clavesTrust: ['SQL_TRUST_SERVER_CERTIFICATE_RECEPCION', 'SQL_TRUST_SERVER_CERTIFICATE'],
    modoPredeterminado: 'sql',
    permiteWindows: false,
  });
}
