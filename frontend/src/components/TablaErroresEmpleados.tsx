/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/components/TablaErroresEmpleados.tsx
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Tooltip,
  Box,
} from "@mui/material";

/* -------------------------------------------------------------------------- */
/*  TIPOS                                                                     */
/* -------------------------------------------------------------------------- */

interface WrongKeyFlag {
  __wrong: true;
  key: string;
}
export type Celda = string | number | WrongKeyFlag;

/**
 * errores puede ser:
 *  - string[] (versión antigua: solo nombres de columnas con error)
 *  - Record<string,string> (versión nueva: columna -> motivo)
 */
export interface EmpleadoTransformado {
  errores?: string[] | Record<string, string>;
  [k: string]: Celda | string[] | Record<string, string> | undefined;
}

/* -------------------------------------------------------------------------- */
/*  COLUMNAS                                                                   */
/* -------------------------------------------------------------------------- */
const columns = [
  "TIPO",
  "DOCUMENTO",
  "NOMBRES",
  "APELLIDOS",
  "GENERO",
  "FECHA DE NACIMIENTO",
  "CARGO O RANGO",
  "FECHA DESIGNACIÓN",
  "TIPO DE EMPLEADO",
  "CATEGORIA EMPLEADO",
  "UNIDAD ORGANIZACIONAL",
  "SUELDO BASE",
  "SFS",
  "AFP",
  "ISR",
  "OTROS DESCUENTOS",
  "FUNCIÓN",
  "SUELDO FUNCIÓN",
  "CÓDIGO UNIDAD ORGANIZACIONAL",
  "CÓDIGO CARGO O RANGO",
  "PODER DEL ESTADO",
] as const;

const correctKey: Record<(typeof columns)[number], string> = {
  TIPO: "TipoDocumento",
  DOCUMENTO: "Documento",
  NOMBRES: "Nombres",
  APELLIDOS: "Apellidos",
  GENERO: "Genero",
  "FECHA DE NACIMIENTO": "FechaNacimiento",
  "CARGO O RANGO": "CargoRango",
  "FECHA DESIGNACIÓN": "FechaDesignacion",
  "TIPO DE EMPLEADO": "TipoEmpleado",
  "CATEGORIA EMPLEADO": "CategoriaEmpleado",
  "UNIDAD ORGANIZACIONAL": "UnidadOrganizacional",
  "SUELDO BASE": "SueldoBase",
  SFS: "SFS",
  AFP: "AFP",
  ISR: "ISR",
  "OTROS DESCUENTOS": "OtrosDescuentos",
  FUNCIÓN: "Funcion",
  "SUELDO FUNCIÓN": "SueldoFuncion",
  "CÓDIGO UNIDAD ORGANIZACIONAL": "CodigoUnidadOrganizacional",
  "CÓDIGO CARGO O RANGO": "CodigoCargoMAP",
  "PODER DEL ESTADO": "PoderEstado",
};

const moneyCols = new Set([
  "SUELDO BASE",
  "SFS",
  "AFP",
  "ISR",
  "OTROS DESCUENTOS",
  "SUELDO FUNCIÓN",
]);

/* -------------------------------------------------------------------------- */
/*  MENSAJES GENÉRICOS (fallback para formato array)                           */
/* -------------------------------------------------------------------------- */
const mensajesGenericos: Record<string, string> = {
  TIPO: "Tipo de documento inválido",
  DOCUMENTO: "Documento inválido",
  NOMBRES: "Nombres inválidos",
  APELLIDOS: "Apellidos inválidos",
  GENERO: "Género inválido",
  "FECHA DE NACIMIENTO": "Fecha de nacimiento inválida",
  "CARGO O RANGO": "Cargo/Rango inválido",
  "FECHA DESIGNACIÓN": "Fecha de designación inválida",
  "TIPO DE EMPLEADO": "Tipo de empleado inválido",
  "CATEGORIA EMPLEADO": "Categoría de empleado inválida",
  "UNIDAD ORGANIZACIONAL": "Unidad organizacional inválida",
  "SUELDO BASE": "Sueldo base inválido",
  SFS: "Valor SFS inválido",
  AFP: "Valor AFP inválido",
  ISR: "Valor ISR inválido",
  "OTROS DESCUENTOS": "Otros descuentos inválidos",
  FUNCIÓN: "Función inválida",
  "SUELDO FUNCIÓN": "Sueldo función inválido",
  "CÓDIGO UNIDAD ORGANIZACIONAL": "Código unidad organizacional inválido",
  "CÓDIGO CARGO O RANGO": "Código cargo/rango inválido",
  "PODER DEL ESTADO": "Poder del Estado inválido",
};

/* -------------------------------------------------------------------------- */
/*  UTILIDADES                                                                */
/* -------------------------------------------------------------------------- */
const normalize = (s: string) => s.replace(/[_\-\s]/g, "").toLowerCase();

const formatMoney = (v: number | string) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(v));

function getValueOrWrongKey(
  row: Record<string, any>,
  expected: string
): Celda | undefined {
  const good = row[expected];
  const goodExists =
    good !== undefined &&
    good !== null &&
    !(typeof good === "string" && good.trim() === "");
  if (goodExists) return good;

  const target = normalize(expected);
  const wrong = Object.keys(row).find(
    (k) =>
      k !== expected &&
      normalize(k) === target &&
      row[k] !== undefined &&
      row[k] !== null &&
      !(typeof row[k] === "string" && row[k].trim() === "")
  );
  if (wrong) return { __wrong: true, key: wrong };
  return undefined;
}

/* -------------------------------------------------------------------------- */
/*  TRANSFORMACIÓN                                                             */
/* -------------------------------------------------------------------------- */
export const transformarEmpleado = (
  original: Record<string, any>,
  errores: string[] | Record<string, string>
): EmpleadoTransformado => {
  const out: EmpleadoTransformado = { errores };
  columns.forEach((col) => {
    out[col] = getValueOrWrongKey(original, correctKey[col]) ?? "";
  });
  return out;
};

/* -------------------------------------------------------------------------- */
/*  COMPONENTE                                                                 */
/* -------------------------------------------------------------------------- */
interface Props {
  datosTabla: EmpleadoTransformado[];
}

const TablaErroresEmpleados: React.FC<Props> = ({ datosTabla }) => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 25;

  const changePage = (
    _: React.MouseEvent<HTMLButtonElement> | null,
    p: number
  ) => setPage(p);

  const slice = datosTabla.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <>
      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell
                  key={c}
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "var(--cnp-blue-dark, #003876)",
                    color: "var(--cnp-white, #FFFFFF)",
                    textAlign: "center",
                  }}
                >
                  {c}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {slice.map((fila, r) => (
              <TableRow key={r}>
                {columns.map((col, c) => {
                  const raw = fila[col] as Celda;

                  // Texto mostrado
                  let text = "";
                  if (
                    typeof raw === "object" &&
                    raw &&
                    (raw as WrongKeyFlag).__wrong
                  ) {
                    text = `Campo incorrecto: ${(raw as WrongKeyFlag).key}`;
                  } else if (
                    col === "FUNCIÓN" &&
                    typeof raw === "string" &&
                    raw.trim().length > 50
                  ) {
                    text = `[muy largo] ${raw}`;
                  } else if (
                    moneyCols.has(col) &&
                    (typeof raw === "string" || typeof raw === "number") &&
                    raw !== ""
                  ) {
                    text = formatMoney(raw);
                  } else {
                    text = String(raw);
                  }

                  // Determinar si hay error y razón
                  let hayError = false;
                  let razon: string | undefined;

                  if (Array.isArray(fila.errores)) {
                    hayError = fila.errores.includes(col);
                    if (hayError) {
                      razon = mensajesGenericos[col] || "Valor inválido";
                    }
                  } else if (fila.errores && typeof fila.errores === "object") {
                    if (
                      Object.prototype.hasOwnProperty.call(fila.errores, col)
                    ) {
                      hayError = true;
                      razon = (fila.errores as Record<string, string>)[col];
                    }
                  }

                  const align =
                    col === "CÓDIGO UNIDAD ORGANIZACIONAL"
                      ? "center"
                      : moneyCols.has(col)
                      ? "right"
                      : text.trim().length <= 1
                      ? "center"
                      : "left";

                  const cellInner =
                    hayError && razon ? (
                      <Tooltip title={razon} arrow placement="top">
                        <Box component="span" sx={{ cursor: "help" }}>
                          {text}
                        </Box>
                      </Tooltip>
                    ) : (
                      text
                    );

                  return (
                    <TableCell
                      key={c}
                      sx={{
                        background: hayError ? "#EE2A24" : "transparent",
                        color: hayError ? "#fff" : "inherit",
                        textAlign: align,
                        fontSize: "0.85rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        padding: "4px",
                      }}
                    >
                      {cellInner}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={datosTabla.length}
        page={page}
        onPageChange={changePage}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[]}
      />
    </>
  );
};

export default TablaErroresEmpleados;
