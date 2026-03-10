/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// frontend/src/components/validaciones.ts

/*  -------------------------------------------------------------------------- */
/*  Tipado auxiliar                                                            */
/* -------------------------------------------------------------------------- */
interface Unidad {
  CodigoUnidadOrganizacional: number;
  // …otras propiedades si las necesitas
}

/* -------------------------------------------------------------------------- */
/*  Funciones utilitarias                                                      */
/* -------------------------------------------------------------------------- */
const isEmpty = (v: any) =>
  v === undefined || v === null || (typeof v === "string" && v.trim() === "");

const onlyDigits = (s: string) => /^\d+$/.test(s.trim());

/* -------------------------------------------------------------------------- */
/*  1. TIPO DE DOCUMENTO                                                       */
/* -------------------------------------------------------------------------- */
export const validateTipo = (fila: Record<string, any>): boolean => {
  try {
    const tipo = String(fila.TipoDocumento).trim();
    return tipo === "C" || tipo === "P";
  } catch (error) {
    console.error("Error en validateTipo:", error);
    return false;
  }
};

/* -------------------------------------------------------------------------- */
/*  2. DOCUMENTO                                                               */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*  2. DOCUMENTO (versión mínima: solo longitud <= 11 y no vacío)              */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*  2. DOCUMENTO                                                              */
/*  Orden requerido:
    1) Rechazar si longitud > 11
    2) Validar reglas según TipoDocumento ("C" o "P")
/* -------------------------------------------------------------------------- */
export const validateDocumento = (fila: Record<string, any>): boolean => {
  try {
    // Validaciones básicas de existencia y tipos
    if (!fila) return false;
    if (typeof fila.Documento !== "string") return false;
    if (typeof fila.TipoDocumento !== "string") return false;

    const doc = fila.Documento.trim();
    const tipo = fila.TipoDocumento.trim();

    // 1) Longitud máxima global
    if (doc.length > 11) return false;

    // 2) No vacío
    if (doc === "") return false;

    // 3) Reglas por tipo
    if (tipo === "C") {
      // Debe tener exactamente 11 dígitos (si llegó aquí, doc.length <= 11)
      if (doc.length !== 11) return false;
      if (!/^\d{11}$/.test(doc)) return false;
      return true;
    } else if (tipo === "P") {
      // Permitimos 1–11 caracteres (ya se validó longitud y no vacío)
      // Si deseas solo alfanumérico, descomenta:
      // if (!/^[A-Za-z0-9]+$/.test(doc)) return false;
      return true;
    }

    // Tipo desconocido
    return false;
  } catch {
    return false;
  }
};

/* -------------------------------------------------------------------------- */
/*  3. NOMBRES – no numérico, máx. 40                                          */
/* -------------------------------------------------------------------------- */
export const validateNombres = (fila: Record<string, any>): boolean => {
  if (
    isEmpty(fila.Nombres) ||
    typeof fila.Nombres !== "string" ||
    onlyDigits(fila.Nombres)
  )
    return false;

  return fila.Nombres.trim().length <= 40;
};

/* -------------------------------------------------------------------------- */
/*  4. APELLIDOS – no numérico, máx. 40                                        */
/* -------------------------------------------------------------------------- */
export const validateApellidos = (fila: Record<string, any>): boolean => {
  if (
    isEmpty(fila.Apellidos) ||
    typeof fila.Apellidos !== "string" ||
    onlyDigits(fila.Apellidos)
  )
    return false;

  return fila.Apellidos.trim().length <= 40;
};

/* -------------------------------------------------------------------------- */
/*  5. PODER DEL ESTADO                                                        */
/* -------------------------------------------------------------------------- */
export const validatePoderEstado = (
  fila: Record<string, any>,
  nivelGobierno: { NivelGobiernoID: number; Descripcion: string }[]
): boolean => {
  if (fila.PoderEstado === undefined || fila.PoderEstado === null) return false;
  const valor = Number(fila.PoderEstado);
  if (isNaN(valor)) return false;
  return nivelGobierno.some((ng) => Number(ng.NivelGobiernoID) === valor);
};

/* -------------------------------------------------------------------------- */
/*  6. GÉNERO                                                                  */
/* -------------------------------------------------------------------------- */
export const validateGenero = (fila: Record<string, any>): boolean => {
  if (
    !fila.Genero ||
    typeof fila.Genero !== "string" ||
    fila.Genero.trim() === ""
  )
    return false;
  return fila.Genero === "F" || fila.Genero === "M";
};

/* -------------------------------------------------------------------------- */
/*  7. FECHA DE NACIMIENTO                                                     */
/* -------------------------------------------------------------------------- */
export const validateFechaNacimiento = (fila: Record<string, any>): boolean => {
  if (isEmpty(fila.FechaNacimiento) || typeof fila.FechaNacimiento !== "string")
    return false;

  const regex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
  const match = fila.FechaNacimiento.trim().match(regex);
  if (!match) return false;

  let [, dayStr, monthStr, yearStr] = match;
  if (dayStr.length === 1) dayStr = "0" + dayStr;
  if (monthStr.length === 1) monthStr = "0" + monthStr;

  const dia = Number(dayStr);
  const mes = Number(monthStr);
  const anio = Number(yearStr);
  const fechaNacimiento = new Date(anio, mes - 1, dia);

  if (
    fechaNacimiento.getFullYear() !== anio ||
    fechaNacimiento.getMonth() !== mes - 1 ||
    fechaNacimiento.getDate() !== dia
  )
    return false;

  const hoy = new Date();
  let edad = hoy.getFullYear() - anio;
  const cumpleEsteAnio = new Date(hoy.getFullYear(), mes - 1, dia);
  if (hoy < cumpleEsteAnio) edad--;
  if (edad < 18) return false;
  if (fechaNacimiento > hoy) return false;

  return true;
};

/* -------------------------------------------------------------------------- */
/*  8. CARGO / RANGO – no numérico, máx. 60                                    */
/* -------------------------------------------------------------------------- */
export const validateCargoRango = (fila: Record<string, any>): boolean => {
  if (
    isEmpty(fila.CargoRango) ||
    typeof fila.CargoRango !== "string" ||
    onlyDigits(fila.CargoRango)
  )
    return false;

  return fila.CargoRango.trim().length <= 60;
};

/* -------------------------------------------------------------------------- */
/*  9. FECHA DESIGNACIÓN                                                       */
/* -------------------------------------------------------------------------- */
export const validateFechaDesignacion = (
  fila: Record<string, any>
): boolean => {
  if (
    isEmpty(fila.FechaDesignacion) ||
    typeof fila.FechaDesignacion !== "string"
  )
    return false;

  const regex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
  const match = fila.FechaDesignacion.trim().match(regex);
  if (!match) return false;

  let [, dayStr, monthStr, yearStr] = match;
  if (dayStr.length === 1) dayStr = "0" + dayStr;
  if (monthStr.length === 1) monthStr = "0" + monthStr;

  const dia = Number(dayStr);
  const mes = Number(monthStr);
  const anio = Number(yearStr);
  const fechaDesignacion = new Date(anio, mes - 1, dia);

  if (
    fechaDesignacion.getFullYear() !== anio ||
    fechaDesignacion.getMonth() !== mes - 1 ||
    fechaDesignacion.getDate() !== dia
  )
    return false;

  return fechaDesignacion <= new Date();
};

/* -------------------------------------------------------------------------- */
/* 10. TIPO DE EMPLEADO                                                        */
/* -------------------------------------------------------------------------- */
export const validateTipoEmpleado = (
  fila: Record<string, any>,
  tiposEmpleados: { Tipo_Empleado: number; Descripcion: string }[]
): boolean => {
  if (isEmpty(fila.TipoEmpleado)) return false;
  const valor = Number(fila.TipoEmpleado);
  if (isNaN(valor)) return false;
  return tiposEmpleados.some((item) => Number(item.Tipo_Empleado) === valor);
};

/* -------------------------------------------------------------------------- */
/* 11. UNIDAD ORGANIZACIONAL – máx. 60                                         */
/* -------------------------------------------------------------------------- */
export const validateUnidadOrganizacional = (
  fila: Record<string, any>
): boolean => {
  if (
    isEmpty(fila.UnidadOrganizacional) ||
    typeof fila.UnidadOrganizacional !== "string"
  )
    return false;

  return fila.UnidadOrganizacional.trim().length <= 60;
};

/* -------------------------------------------------------------------------- */
/* 12. SUELDO BASE                                                             */
/* -------------------------------------------------------------------------- */
export const validateSueldoBase = (fila: Record<string, any>): boolean => {
  const sueldoBase = fila.SueldoBase;
  if (sueldoBase == null || sueldoBase === "") return false;
  if (isNaN(sueldoBase) || Number(sueldoBase) <= 0) return false;
  if (!/^\d+(\.\d+)?$/.test(String(sueldoBase))) return false;
  return true;
};

/* -------------------------------------------------------------------------- */
/* 13. FUNCIÓN – no numérica, máx. 50                                          */
/* -------------------------------------------------------------------------- */
export const validateFuncion = (fila: Record<string, any>): boolean => {
  const valor = fila.Funcion;
  if (isEmpty(valor)) return true;

  const str = String(valor).trim();
  if (/^[+-]?\d+(\.\d+)?$/.test(str)) return false;
  return str.length <= 50;
};

/* -------------------------------------------------------------------------- */
/* 14. SUELDO FUNCIÓN                                                          */
/* -------------------------------------------------------------------------- */
export const validateSueldoFuncion = (fila: Record<string, any>): boolean => {
  const sueldoFuncion = fila["SueldoFuncion"];
  if (isEmpty(sueldoFuncion)) return false;
  if (typeof sueldoFuncion === "string" && /[a-zA-Z]/.test(sueldoFuncion))
    return false;
  const numericValue = Number(sueldoFuncion);
  return !isNaN(numericValue) && numericValue >= 0;
};

/* -------------------------------------------------------------------------- */
/* 15-16. SFS y AFP (optional: allow empty; if provided, must be numeric)     */
/* -------------------------------------------------------------------------- */
export const validateSFS = (fila: Record<string, any>): boolean => {
  const value = fila.SFS;

  // Optional: valid when empty/undefined/null
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return true;
  }

  // If provided: must be numeric (finite)
  const num = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(num);
};

export const validateAFP = (fila: Record<string, any>): boolean => {
  const value = fila.AFP;

  // Optional: valid when empty/undefined/null
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return true;
  }

  // If provided: must be numeric (finite)
  const num = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(num);
};

/* -------------------------------------------------------------------------- */
/* 17. ISR                                                                    */
/* -------------------------------------------------------------------------- */
export const validateISR = (fila: Record<string, any>): boolean => {
  if (isEmpty(fila.ISR)) return false;
  const n = Number(fila.ISR);
  if (isNaN(n) || n < 0) return false;
  if (typeof fila.ISR === "string" && /[a-zA-Z]/.test(fila.ISR)) return false;
  return true;
};

interface Unidad {
  ID: string; // viene como string desde el backend
  DESCRIPCION: string;
}
/* -------------------------------------------------------------------------- */
/* 18. CÓDIGO UNIDAD ORGANIZACIONAL                                            */
/* -------------------------------------------------------------------------- */
export const validateCodigoUnidadOrganizacional = (
  fila: Record<string, any>,
  catalogo: { ID: string; DESCRIPCION: string }[]
): boolean => {
  const poder = Number(fila.PoderEstado);
  const codigo = Number(fila.CodigoUnidadOrganizacional);

  if (isNaN(poder) || isNaN(codigo)) {
    return false;
  }

  if (poder === 4) {
    // Para gobiernos locales, el código debe coincidir con algún ID del catálogo
    return catalogo.some((u) => Number(u.ID) === codigo);
  }

  if (
    typeof fila.CodigoUnidadOrganizacional === "string" &&
    fila.CodigoUnidadOrganizacional.trim() === ""
  ) {
    return false;
  }

  // Para otros poderes, el código debe ser exactamente 0
  return codigo === 0;
};

/* -------------------------------------------------------------------------- */
/* 19. CÓDIGO CARGO MAP (debe ser 0)                                           */
/* -------------------------------------------------------------------------- */
export const validateCodigoCargoRango = (
  fila: Record<string, any>
): boolean => {
  if (fila.CodigoCargoMAP === null || fila.CodigoCargoMAP === "") return false;
  const codigo = Number(fila.CodigoCargoMAP);
  return !isNaN(codigo) && codigo === 0;
};

/* -------------------------------------------------------------------------- */
/* 20. OTROS DESCUENTOS                                                        */
/* -------------------------------------------------------------------------- */
export const validateOtrosDescuentos = (fila: Record<string, any>): boolean => {
  const valor = fila.OtrosDescuentos;
  if (isEmpty(valor)) return false;
  const valorStr = String(valor).trim();
  if (/[a-zA-Z]/.test(valorStr)) return false;
  const numericValue = Number(valorStr);
  return !isNaN(numericValue) && numericValue >= 0;
};

/* -------------------------------------------------------------------------- */
/* 21. CATEGORÍA EMPLEADO                                                      */
/* -------------------------------------------------------------------------- */
export const validateCategoriaEmpleado = (
  fila: Record<string, any>,
  categoriaEmpleados: { Categoria_Empleado: number; Descripcion: string }[]
): boolean => {
  if (isEmpty(fila.CategoriaEmpleado)) return false; // no debe estar en blanco
  const valor = Number(fila.CategoriaEmpleado);
  if (isNaN(valor)) return false;

  const tipo = Number(fila.TipoEmpleado ?? NaN);
  if (tipo === 3 && valor === 0) return true; // excepción para tipo 3

  return categoriaEmpleados.some(
    (item) => Number(item.Categoria_Empleado) === valor
  );
};
