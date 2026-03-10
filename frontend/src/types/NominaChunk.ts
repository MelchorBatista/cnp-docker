/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/types/NominaChunk.ts
/**
 * Interfaz que define la estructura de un chunk de la nómina.
 */
export interface NominaChunk {
  chunkIndex: number; // Índice del fragmento actual
  totalChunks: number; // Número total de fragmentos
  isFirstChunk: boolean; // Indica si es el primer fragmento
  isLastChunk: boolean; // Indica si es el último fragmento
  header?: {
    // Información del encabezado, incluida solo en el primer chunk
    UsuarioID: number | null;
    NombreUsuario: string;
    FechaHora: string;
    ResultadoIntento: string;
    EncabezadoValido: boolean;
    DetalleValido: boolean;
    CantidadEmpleados: number;
    EmpleadosInvalidos: number;
    Anio: number;
    Mes: number;
    CodigoOrganismoMAP: number;
  };
  data: any[]; // Fragmento del arreglo "Detalle"
}
