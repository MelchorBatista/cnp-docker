/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/utils/nominaSender.ts
import socket from "../utils/socket";
import { NominaChunk } from "../types/NominaChunk";

/**
 * Envía secuencialmente los chunks de la nómina al backend mediante Socket.io.
 * @param chunks - Arreglo de NominaChunk a enviar.
 * @param progressCallback - Función callback para actualizar el progreso (porcentaje).
 * @returns Promise que se resuelve cuando se han enviado todos los chunks.
 */
export async function sendNominaChunks(
  chunks: NominaChunk[],
  progressCallback: (progress: number) => void
): Promise<void> {
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    await new Promise<void>((resolve, reject) => {
      socket.emit("enviarNominaChunk", chunk, (response: any) => {
        if (response && response.error) {
          reject(response.error);
        } else {
          // Calcular y actualizar el progreso
          const progress = Math.round(((i + 1) / chunks.length) * 100);
          progressCallback(progress);
          resolve();
        }
      });
    });
  }
}
