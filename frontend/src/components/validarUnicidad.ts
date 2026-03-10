/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
//src/components/validarUnicidad.ts

/* ────────────────────────────────────────────────────────────────────────────
   Validar unicidad de los documentos en la nómina
   Devuelve un arreglo con los empleados duplicados y un callback de progreso
 ──────────────────────────────────────────────────────────────────────────── */

export interface EmpleadoDuplicado {
  Documento: string;
  Nombres: string;
  Apellidos: string;
  indices: number[]; // posiciones en el array original (por si los necesitas)
}

export interface ResultadoUnicidad {
  duplicados: EmpleadoDuplicado[];
}

export async function validarUnicidad(
  empleados: Record<string, any>[],
  onProgress?: (p: number) => void
): Promise<ResultadoUnicidad> {
  const map = new Map<string, EmpleadoDuplicado>();
  const tot = empleados.length;

  for (let i = 0; i < tot; i++) {
    const e = empleados[i];
    const doc: string = String(e.Documento ?? "").trim();

    if (doc !== "") {
      if (!map.has(doc)) {
        map.set(doc, {
          Documento: doc,
          Nombres: e.Nombres ?? "",
          Apellidos: e.Apellidos ?? "",
          indices: [i],
        });
      } else {
        map.get(doc)!.indices.push(i);
      }
    }

    /* ─── actualización de progreso cada ~1 % ─── */
    if (
      onProgress &&
      (i + 1 === tot || (i + 1) % Math.max(1, Math.floor(tot / 100)) === 0)
    ) {
      onProgress(Math.round(((i + 1) / tot) * 100));
      await new Promise((r) => requestAnimationFrame(r));
    }
  }

  /* Filtra aquellos documentos con al menos 2 apariciones */
  const duplicados = [...map.values()].filter((d) => d.indices.length > 1);
  return { duplicados };
}
