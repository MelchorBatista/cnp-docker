/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
import { useEffect, useMemo } from "react";

/**
 * Genera una clave aleatoria de 32 bytes al montar el componente
 * y la elimina de memoria cuando se desmonta.
 *
 * Devuelve Uint8Array para usar directamente con Web Crypto.
 */
export function useValidationKey(): Uint8Array {
  const key = useMemo(() => crypto.getRandomValues(new Uint8Array(32)), []);

  useEffect(() => {
    return () => {
      // Limpieza: sobrescribe la memoria.
      key.fill(0);
    };
  }, [key]);

  return key;
}
