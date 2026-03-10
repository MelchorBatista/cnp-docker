/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// /types/nomina.d.ts
/* ───────────────────────── Detalle de empleados ───────────────────────── */
export interface DetalleEmpleado {
  Documento: string;
  TipoDocumento: string;
  Apellidos: string;
  Nombres: string;
  FechaNacimiento: string; // ‘YYYY-MM-DD’
  Genero: string;
  TipoEmpleado: string;
  CategoriaEmpleado: string;
  CargoRango: string;
  FechaDesignacion: string; // ‘YYYY-MM-DD’
  UnidadOrganizacional: string;
  PoderEstado: string;
  CodigoOrganismoMAP: number;
  CodigoUnidadOrganizacional: string;
  CodigoCargoMAP: string;
  SueldoBase: number;
  Funcion: string;
  SueldoFuncion: number;
  SFS: number;
  ISR: number;
  AFP: number;
  OtrosDescuentos: number;
  Anio: number;
  Mes: number;
  FechaCargaDatos: string; // ‘YYYY-MM-DDTHH:MM:SS’
}

/* ──────────────────────── Encabezado ─────────────────────── */
export interface NominaCompleta {
  NombreUsuario: string;
  UsuarioID: number | null;
  Anio: number;
  Mes: number;
  CodigoOrganismoMAP: number;
  ResultadoIntento: string;
  EncabezadoValido: boolean;
  DetalleValido: boolean;
  CantidadEmpleados: number;
  EmpleadosInvalidos: number;
  FechaHora: string;
  FechaCargaDatos: string;
  Detalle: DetalleEmpleado[];
}
