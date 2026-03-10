/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// rnp/backend/services/RecibirNominaService.ts
import { connectRecepcion, sql } from '../config/connectRecepcion';
import { io } from '../server';
import { formatoEntero } from '../utils/formatoEntero';
import { registrarAuditoria } from '../middleware/audit';

/* ═════════════════ util (kept for non-TZ fields). Do NOT use for DB TZ-critical fields ═════════════════ */
function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  if (dateStr.includes('T')) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [day, month, year] = parts.map((p) => parseInt(p, 10));
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/* ═════════════ interfaces ═════════════ */
export interface NominaDetalle {
  CategoriaEmpleado: number;
  OtrosDescuentos: number;
  CodigoCargoMap: number;
  CodigoUnidadOrganizacional: number;
  SueldoFuncion: number;
  Funcion: string;
  SFS: number;
  ISR: number;
  AFP: number;
  SueldoBase: number;
  UnidadOrganizacional: string;
  TipoEmpleado: number;
  FechaDesignacion: string; // varchar(10)
  CargoRango: string;
  FechaNacimiento: string; // varchar(10)
  Genero: string;
  Apellidos: string;
  Nombres: string;
  PoderEstado: number;
  CodigoOrganismoMAP: number;
  Documento: string;
  TipoDocumento: string;
  Anio: number;
  Mes: number;
  FechaCargaDatos: string; // ISO string; DB conversion enforces DR time
}

export interface IntentoNomina {
  UsuarioID: number | null;
  NombreUsuario: string;
  FechaHora: string; // ISO string; DB conversion enforces DR time
  ResultadoIntento: string;
  EncabezadoValido: boolean;
  DetalleValido: boolean;
  CantidadEmpleados: number;
  EmpleadosInvalidos: number;
  Anio: number;
  Mes: number;
  CodigoOrganismoMAP: number;
  Detalle: NominaDetalle[];
}

export interface ProcesarNominaResult {
  mensaje: string;
  headerId?: number;
}

/* ═════════════ 1) Main process (success/rollback) ═════════════ */
export async function procesarNominaJSON(nomina: IntentoNomina): Promise<ProcesarNominaResult> {
  const pool = await connectRecepcion();
  const transaction = new sql.Transaction(pool as any);

  try {
    await transaction.begin();

    /* 1) Insert header */
    io.emit('progress', { progress: 10, message: 'Inserting header...' });

    const headerReq = new sql.Request(transaction);
    headerReq.input('UsuarioID', sql.Int, nomina.UsuarioID);
    headerReq.input('OrganismoID', sql.Int, nomina.CodigoOrganismoMAP);

    // ✅ Pass as NVARCHAR and enforce DR (UTC-4) in SQL using SWITCHOFFSET
    headerReq.input('FechaHoraISO', sql.NVarChar(40), String(nomina.FechaHora));

    headerReq.input('ResultadoIntento', sql.VarChar, nomina.ResultadoIntento);
    headerReq.input('EncabezadoValido', sql.Bit, nomina.EncabezadoValido);
    headerReq.input('DetalleValido', sql.Bit, nomina.DetalleValido);
    headerReq.input('CantidadEmpleados', sql.Int, nomina.CantidadEmpleados);
    headerReq.input('EmpleadosInvalidos', sql.Int, nomina.EmpleadosInvalidos);

    const headerRes = await headerReq.query(`
      INSERT INTO [dbo].[RNP_IntentosNomina]
        (UsuarioID, OrganismoID, FechaHora, ResultadoIntento, EncabezadoValido,
         DetalleValido, CantidadEmpleados, EmpleadosInvalidos)
      OUTPUT INSERTED.Id
      VALUES (
        @UsuarioID,
        @OrganismoID,
        /* Force DR timezone (UTC-4) at insert time */
        SWITCHOFFSET(CONVERT(datetimeoffset, @FechaHoraISO), '-04:00'),
        @ResultadoIntento,
        @EncabezadoValido,
        @DetalleValido,
        @CantidadEmpleados,
        @EmpleadosInvalidos
      )
    `);
    const headerId = headerRes.recordset[0].Id;

    io.emit('progress', {
      progress: 30,
      message: 'Header inserted. Inserting details...',
    });

    /* 2) Insert details */
    const totalDetalles = nomina.Detalle.length;
    for (let i = 0; i < totalDetalles; i++) {
      const d = nomina.Detalle[i];
      const detReq = new sql.Request(transaction);

      detReq.input('TipoDocumento', sql.VarChar, d.TipoDocumento);
      detReq.input('Documento', sql.VarChar, d.Documento);
      detReq.input('Anio', sql.Int, d.Anio);
      detReq.input('Mes', sql.Int, d.Mes);
      detReq.input('CodigoOrganismoMAP', sql.Int, d.CodigoOrganismoMAP);
      detReq.input('PoderEstado', sql.Int, d.PoderEstado);
      detReq.input('Nombres', sql.VarChar, d.Nombres);
      detReq.input('Apellidos', sql.VarChar, d.Apellidos);
      detReq.input('Genero', sql.VarChar, d.Genero);

      // Stored as plain varchar(10) (no TZ conversion needed)
      detReq.input('FechaNacimiento', sql.VarChar(10), d.FechaNacimiento);
      detReq.input('CargoRango', sql.VarChar, d.CargoRango);
      detReq.input('FechaDesignacion', sql.VarChar(10), d.FechaDesignacion);

      detReq.input('TipoEmpleado', sql.Int, d.TipoEmpleado);
      detReq.input('UnidadOrganizacional', sql.VarChar, d.UnidadOrganizacional);
      detReq.input('SueldoBase', sql.Decimal(18, 2), d.SueldoBase);
      detReq.input('AFP', sql.Decimal(18, 2), d.AFP);
      detReq.input('ISR', sql.Decimal(18, 2), d.ISR);
      detReq.input('SFS', sql.Decimal(18, 2), d.SFS);
      detReq.input('Funcion', sql.VarChar, d.Funcion);
      detReq.input('SueldoFuncion', sql.Decimal(18, 2), d.SueldoFuncion);
      detReq.input('CodigoUnidadOrganizacional', sql.Int, d.CodigoUnidadOrganizacional);
      detReq.input('CodigoCargoMap', sql.Int, d.CodigoCargoMap);

      // ✅ Pass as NVARCHAR and enforce DR (UTC-4) at insert time
      detReq.input('FechaCargaDatosISO', sql.NVarChar(40), String(d.FechaCargaDatos));

      detReq.input('OtrosDescuentos', sql.Decimal(18, 2), d.OtrosDescuentos);
      detReq.input('CategoriaEmpleado', sql.Int, d.CategoriaEmpleado);

      await detReq.query(`
        INSERT INTO [dbo].[RNP_Datos_Nomina]
          (TipoDocumento, Documento, Anio, Mes, CodigoOrganismoMAP, PoderEstado, Nombres, Apellidos, Genero,
           FechaNacimiento, CargoRango, FechaDesignacion, TipoEmpleado, UnidadOrganizacional, SueldoBase, AFP,
           ISR, SFS, Funcion, SueldoFuncion, CodigoUnidadOrganizacional, CodigoCargoMap, FechaCargaDatos,
           OtrosDescuentos, CategoriaEmpleado, IntentoId)
        VALUES
          (@TipoDocumento, @Documento, @Anio, @Mes, @CodigoOrganismoMAP, @PoderEstado, @Nombres, @Apellidos, @Genero,
           @FechaNacimiento, @CargoRango, @FechaDesignacion, @TipoEmpleado, @UnidadOrganizacional, @SueldoBase, @AFP,
           @ISR, @SFS, @Funcion, @SueldoFuncion, @CodigoUnidadOrganizacional, @CodigoCargoMap,
           /* Force DR timezone (UTC-4) at insert time */
           SWITCHOFFSET(CONVERT(datetimeoffset, @FechaCargaDatosISO), '-04:00'),
           @OtrosDescuentos, @CategoriaEmpleado, ${headerId})
      `);

      io.emit('progress', {
        progress: 30 + Math.round(((i + 1) / totalDetalles) * 40),
        message: `Empleado ${formatoEntero(i + 1)} de ${formatoEntero(totalDetalles)}`,
      });
    }

    /* 3) Commit */
    io.emit('progress', { progress: 90, message: 'Committing transaction...' });
    await transaction.commit();
    io.emit('progress', {
      progress: 100,
      message: 'Processing completed successfully.',
    });

    /* 4) Audit success */
    await registrarAuditoria(
      nomina.UsuarioID ?? null,
      'CARGA DE NOMINA EXITOSA',
      'Subir Nómina JSON',
      `Carga de nómina con ${formatoEntero(nomina.CantidadEmpleados)} empleados.`,
      undefined,
      nomina.NombreUsuario,
    );

    return { mensaje: 'Nómina procesada e insertada correctamente', headerId };
  } catch (error) {
    await transaction.rollback();
    io.emit('progress', {
      progress: 0,
      message: 'Error en el procesamiento de la nómina.',
    });

    /* 5) Audit failure */
    await registrarAuditoria(
      nomina.UsuarioID ?? null,
      'CARGA DE NOMINA FALLIDA',
      'Subir Nómina JSON',
      error instanceof Error ? error.message : String(error),
      undefined,
      nomina.NombreUsuario,
    );

    throw error;
  }
}

/* ═════════════ 2) Client-reported failed attempt ═════════════ */
export interface ReporteErroresNomina {
  UsuarioID: number | null;
  NombreUsuario: string;
  FechaHora: string; // ISO string
  ResultadoIntento: string;
  EncabezadoValido: boolean;
  DetalleValido: boolean;
  CantidadEmpleados: number | null;
  EmpleadosInvalidos: number;
  Anio: number | null;
  Mes: number | null;
  CodigoOrganismoMAP: number | null;
  Detalle: any[];
}

export async function procesarIntentoNominaFallido(intento: ReporteErroresNomina, direccionIP?: string): Promise<void> {
  const pool = await connectRecepcion();
  const tx = new sql.Transaction(pool as any);

  try {
    await tx.begin();

    const rq = new sql.Request(tx);
    rq.input('UsuarioID', sql.Int, intento.UsuarioID);
    rq.input('OrganismoID', sql.Int, intento.CodigoOrganismoMAP);

    // ✅ Pass as NVARCHAR; enforce DR at insert
    rq.input('FechaHoraISO', sql.NVarChar(40), String(intento.FechaHora));

    rq.input('ResultadoIntento', sql.VarChar, 'Fallido');
    rq.input('EncabezadoValido', sql.Bit, intento.EncabezadoValido);
    rq.input('DetalleValido', sql.Bit, intento.DetalleValido);
    rq.input('CantidadEmpleados', sql.Int, intento.CantidadEmpleados);
    rq.input('EmpleadosInvalidos', sql.Int, intento.EmpleadosInvalidos);

    await rq.query(`
      INSERT INTO [dbo].[RNP_IntentosNomina]
        (UsuarioID, OrganismoID, FechaHora, ResultadoIntento, EncabezadoValido,
         DetalleValido, CantidadEmpleados, EmpleadosInvalidos)
      VALUES
        (
          @UsuarioID,
          @OrganismoID,
          /* Force DR timezone (UTC-4) at insert time */
          SWITCHOFFSET(CONVERT(datetimeoffset, @FechaHoraISO), '-04:00'),
          @ResultadoIntento,
          @EncabezadoValido,
          @DetalleValido,
          @CantidadEmpleados,
          @EmpleadosInvalidos
        )
    `);

    await tx.commit();

    /* Audit: client-side validation failure */
    await registrarAuditoria(
      intento.UsuarioID ?? null,
      'CARGA DE NOMINA FALLIDA',
      'Subir Nómina JSON',
      `Intento fallido (reportado por cliente): ${intento.EmpleadosInvalidos} empleados inválidos.`,
      direccionIP,
      intento.NombreUsuario,
    );
  } catch (err) {
    await tx.rollback();
    console.error('Error al registrar intento fallido de nómina:', err);
    throw err;
  }
}
