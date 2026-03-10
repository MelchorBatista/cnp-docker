/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/utils/VerificarEstructuraJSON.tsx
/**
 * Verifies the *structure* of a nómina JSON payload:
 *  - Exact top-level keys: Anio, Mes, CodigoOrganismoMAP, Detalle
 *  - Detalle is an array of objects
 *  - Each employee object must contain exactly the expected keys (no missing / no unknown)
 *  - Does **not** validate values or business rules (that remains elsewhere)
 */
export interface StructureCheckResult {
  ok: boolean;
  errors: string[];
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

// Case-insensitive key comparison helpers
const normKey = (k: string) => k.toLowerCase();
const hasKeyCI = (obj: Record<string, unknown>, key: string): boolean => {
  const target = normKey(key);
  return Object.keys(obj).some((k) => normKey(k) === target);
};
const getPropCI = <T = unknown>(obj: Record<string, unknown>, key: string): T | undefined => {
  const target = normKey(key);
  for (const k of Object.keys(obj)) {
    if (normKey(k) === target) return (obj as any)[k] as T;
  }
  return undefined;
};

const TOP_LEVEL_KEYS = [
  "Anio",
  "Mes",
  "CodigoOrganismoMAP",
  "Detalle",
] as const;

// Campos esperados por empleado según el esquema proporcionado
const EMPLOYEE_KEYS = [
  "TipoDocumento",
  "Documento",
  "Nombres",
  "Apellidos",
  "PoderEstado",
  "Genero",
  "FechaNacimiento",
  "CargoRango",
  "FechaDesignacion",
  "TipoEmpleado",
  "CategoriaEmpleado",
  "UnidadOrganizacional",
  "SueldoBase",
  "Funcion",
  "SueldoFuncion",
  "SFS",
  "AFP",
  "ISR",
  "OtrosDescuentos",
  "CodigoUnidadOrganizacional",
  "CodigoCargoMAP",
] as const;

/**
 * Strict structural verification. Focuses only on field names / nesting.
 * Returns a compact list of errors (capped) to avoid overwhelming the UI.
 */
export function verificarEstructuraNomina(raw: unknown): StructureCheckResult {
  const errors: string[] = [];
  const MAX_ERRORS = 200;
  const MAX_EMP_ITEMS_LISTED = 100;

  if (!isPlainObject(raw)) {
    errors.push(
      "El JSON de nivel superior debe ser un objeto con las claves: Anio, Mes, CodigoOrganismoMAP, Detalle (sin distinguir mayusculas/minusculas)."
    );
    return { ok: false, errors };
  }

  const topKeys = Object.keys(raw);
  const presentTopLower = new Set(topKeys.map((k) => k.toLowerCase()));
  const expectedTopLower = new Set(
    (TOP_LEVEL_KEYS as readonly string[]).map((k) => k.toLowerCase())
  );
  const missingTop = (TOP_LEVEL_KEYS as readonly string[]).filter(
    (k) => !presentTopLower.has(k.toLowerCase())
  );
  const unknownTop = topKeys.filter((k) => !expectedTopLower.has(k.toLowerCase()));

  if (missingTop.length > 0) {
    errors.push(
      `Falta(n) campo(s) de nivel superior: ${missingTop.join(", ")}`
    );
  }
  if (unknownTop.length > 0) {
    errors.push(
      `Campo(s) de nivel superior desconocido(s): ${unknownTop.join(
        ", "
      )}. Solo se permiten: ${TOP_LEVEL_KEYS.join(", ")}`
    );
  }

  // Early exit if Detalle absent or not array
  const detalle = getPropCI<any[]>(raw, "Detalle");
  if (!Array.isArray(detalle)) {
    errors.push(
      "«Detalle» debe ser un arreglo (array) de objetos de empleados."
    );
    return { ok: errors.length === 0, errors };
  }

  // Verify each employee object structure
  for (let i = 0; i < detalle.length; i++) {
    if (errors.length >= MAX_ERRORS) break;
    const item = detalle[i];

    if (!isPlainObject(item)) {
      errors.push(`Detalle[${i}] debe ser un objeto.`);
      continue;
    }

    const itemKeys = Object.keys(item);
    const itemKeysLower = new Set(itemKeys.map((k) => k.toLowerCase()));
    const expectedEmpLower = new Set(
      (EMPLOYEE_KEYS as readonly string[]).map((k) => k.toLowerCase())
    );

    const missingEmp = (EMPLOYEE_KEYS as readonly string[]).filter(
      (k) => !itemKeysLower.has(k.toLowerCase())
    );
    const unknownEmp = itemKeys.filter((k) => !expectedEmpLower.has(k.toLowerCase()));

    if (missingEmp.length > 0) {
      errors.push(
        `Detalle[${i}] campo(s) faltante(s): ${missingEmp.join(", ")}`
      );
    }
    if (unknownEmp.length > 0) {
      // For huge payloads, shorten per-item unknown listing for readability
      const listed =
        unknownEmp.length > MAX_EMP_ITEMS_LISTED
          ? `${unknownEmp.slice(0, MAX_EMP_ITEMS_LISTED).join(", ")}, … (+${
              unknownEmp.length - MAX_EMP_ITEMS_LISTED
            } más)`
          : unknownEmp.join(", ");
      errors.push(
        `Detalle[${i}] campo(s) desconocido(s): ${listed}. Solo se permiten: ${EMPLOYEE_KEYS.join(
          ", "
        )}`
      );
    }
  }

  return { ok: errors.length === 0, errors };
}
