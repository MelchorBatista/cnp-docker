/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/utils/nominaChunker.ts
import { NominaChunk } from "../types/NominaChunk";
import { chunkArray } from "./chunkArray";

/**
 * Crea un arreglo de chunks a partir de la nómina completa.
 * @param nominaCompleta - Objeto de nómina completo a transmitir.
 * @param chunkSize - Tamaño (número de elementos) de cada fragmento.
 * @returns Arreglo de NominaChunk.
 */
export function createNominaChunks(
  nominaCompleta: any,
  chunkSize: number
): NominaChunk[] {
  // Dividir el arreglo de detalles en fragmentos
  const detalleChunks = chunkArray(nominaCompleta.Detalle, chunkSize);
  const totalChunks = detalleChunks.length;

  // Crear un chunk para cada fragmento del arreglo
  const chunks: NominaChunk[] = detalleChunks.map((chunkData, index) => {
    const isFirstChunk = index === 0;
    const isLastChunk = index === totalChunks - 1;

    // Solo en el primer chunk incluimos los datos del encabezado
    const header = isFirstChunk
      ? {
          UsuarioID: nominaCompleta.UsuarioID,
          NombreUsuario: nominaCompleta.NombreUsuario,
          FechaHora: nominaCompleta.FechaHora,
          ResultadoIntento: nominaCompleta.ResultadoIntento,
          EncabezadoValido: nominaCompleta.EncabezadoValido,
          DetalleValido: nominaCompleta.DetalleValido,
          CantidadEmpleados: nominaCompleta.CantidadEmpleados,
          EmpleadosInvalidos: nominaCompleta.EmpleadosInvalidos,
          Anio: nominaCompleta.Anio,
          Mes: nominaCompleta.Mes,
          CodigoOrganismoMAP: nominaCompleta.CodigoOrganismoMAP,
        }
      : undefined;

    return {
      chunkIndex: index,
      totalChunks,
      isFirstChunk,
      isLastChunk,
      header,
      data: chunkData,
    };
  });
  return chunks;
}
