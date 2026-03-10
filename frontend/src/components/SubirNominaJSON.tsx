/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/components/SubirNominaJSON.tsx
import React, { useState, useRef, useEffect, ChangeEvent } from "react";
import { useSelector } from "react-redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import {
  validateTipo,
  validateDocumento,
  validateNombres,
  validateApellidos,
  validatePoderEstado,
  validateGenero,
  validateFechaNacimiento,
  validateCargoRango,
  validateFechaDesignacion,
  validateTipoEmpleado,
  validateUnidadOrganizacional,
  validateSueldoBase,
  validateFuncion,
  validateSueldoFuncion,
  validateSFS,
  validateAFP,
  validateISR,
  validateCodigoUnidadOrganizacional,
  validateCodigoCargoRango,
  validateOtrosDescuentos,
  validateCategoriaEmpleado,
} from "./validaciones";
import { getUserAssignments, Assignment } from "../services/assignmentUsers";
import jwtDecode from "jwt-decode";
import {
  fetchValidationData,
  ValidationData,
} from "../services/validationDataClient";
import TablaErroresEmpleados, {
  transformarEmpleado,
  EmpleadoTransformado,
} from "./TablaErroresEmpleados";
import { useNavigate } from "react-router-dom";
import socket from "../utils/socket";
import { createNominaChunks } from "../utils/nominaChunker";
import { sendNominaChunks } from "../utils/nominaSender";
import { traducirErrorJSON } from "../utils/jsonErrors";
import { createCaseInsensitiveProxy } from "../utils/createCaseInsensitiveProxy";
import { DetalleEmpleado } from "../types/nomina";
import { existeNomina, borrarNomina } from "../services/nominaExistenteService";
import { validarUnicidad, EmpleadoDuplicado } from "./validarUnicidad";

// Cifrado
import { useValidationKey } from "../hooks/useValidationKey";
import { fetchEncryptedValidationData } from "../services/apiClient";
import { decrypt as decryptAES } from "../utils/aesGcm";

// src/components/SubirNominaJSON.tsx
// INSERT this import alongside the other imports at the top
import { verificarEstructuraNomina } from "./VerificarEstructuraJSON";

/* Helper base64url → Uint8Array */
const b64ToU8 = (b64: string): Uint8Array => {
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const base64 = b64.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

/* FechaCargaDatos en zona horaria de República Dominicana (UTC-4) */
const getFechaCargaDatos = (): string => {
  const tz = "America/Santo_Domingo";
  const now = new Date();

  // Componentes de fecha/hora en esa zona
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  ) as Record<string, string>;

  // RD no usa horario de verano actualmente → offset fijo -04:00
  const offset = "-04:00";
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`;
};

interface SubirNominaJSONProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface JwtPayload {
  id: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

const SubirNominaJSON: React.FC<SubirNominaJSONProps> = ({ open, setOpen }) => {
  const token: string = useSelector((state: any) => state.auth.token);
  const decodedToken = token ? jwtDecode<JwtPayload>(token) : null;
  const userRole = decodedToken?.role || "";
  const navigate = useNavigate();
  const uuidKey = useValidationKey();

  /* ───── Estados principales ───── */
  const [loadingValidation, setLoadingValidation] = useState<boolean>(true);
  const [validationData, setValidationData] = useState<ValidationData | null>(
    null
  );
  const [mensajeError, setMensajeError] = useState<string[]>([]);
  const [progresoCarga, setProgresoCarga] = useState<number>(0);
  const [mostrandoProgreso, setMostrandoProgreso] = useState<boolean>(false);
  const [datosTabla, setDatosTabla] = useState<EmpleadoTransformado[]>([]);
  const [progresoValidacion, setProgresoValidacion] = useState<number>(0);
  const [validacionEnCurso, setValidacionEnCurso] = useState<boolean>(false);
  const [validacionCompletada, setValidacionCompletada] =
    useState<boolean>(false);
  const [empleadosInvalidosCount, setEmpleadosInvalidosCount] =
    useState<number>(0);
  const [empleadosValidosCount, setEmpleadosValidosCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [userAssignments, setUserAssignments] = useState<Assignment[]>([]);
  const [selectedOrganismo, setSelectedOrganismo] = useState<Assignment | null>(
    null
  );
  const [organismos, setOrganismos] = useState<any[]>([]);

  /* Encabezado */
  const [anioNomina, setAnioNomina] = useState<number | null>(null);
  const [mesNomina, setMesNomina] = useState<number | null>(null);
  const [organismoNomina, setOrganismoNomina] = useState<number | null>(null);

  /* JSON original */
  const [nominaJsonData, setNominaJsonData] = useState<any>(null);

  /* Transmisión */
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendingSuccess, setSendingSuccess] = useState<boolean>(false);
  const [progresoTransmision, setProgresoTransmision] = useState<number>(0);
  const [mensajeProgreso, setMensajeProgreso] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /* Sustitución */
  const [showReplaceDialog, setShowReplaceDialog] = useState<boolean>(false);
  const [replaceInfo, setReplaceInfo] = useState<{
    anio: number;
    mes: number;
    org: number;
  } | null>(null);

  /* Unicidad */
  const [progresoUnicidad, setProgresoUnicidad] = useState<number>(0);
  const [unicidadEnCurso, setUnicidadEnCurso] = useState<boolean>(false);
  const [empleadosDuplicados, setEmpleadosDuplicados] = useState<
    EmpleadoDuplicado[]
  >([]);
  const [mensajeErrorUnicidad, setMensajeErrorUnicidad] = useState<string[]>(
    []
  );

  /* Socket progreso */
  useEffect(() => {
    const handleProgress = (data: { progress: number; message: string }) => {
      setProgresoTransmision(data.progress);
      setMensajeProgreso(data.message);
    };
    socket.on("progress", handleProgress);
    return () => {
      socket.off("progress", handleProgress);
    };
  }, []);

  /* Reporte errores */
  const enviarReporteErrores = (
    anio: number | null,
    mes: number | null,
    codigoOrganismo: number | null,
    registrosAfectadosCount = 0,
    cantidadTotalEmpleadosOriginal: number | null = null,
    tipoError:
      | "ValidacionDetallada"
      | "Unicidad"
      | "Encabezado" = "ValidacionDetallada"
  ): void => {
    const UsuarioID = decodedToken?.id ?? null;
    const NombreUsuario = decodedToken?.email ?? "";
    // Sugerencia aplicada: también registrar en horario de RD
    const FechaHora = getFechaCargaDatos();

    let resultadoIntentoEspecifico = "Fallido";
    let mensajePrincipalFalla = "La carga de la nómina falló.";
    let listaErroresParaReporte: string[] = [];

    if (tipoError === "Unicidad") {
      resultadoIntentoEspecifico = "Fallido - Duplicados";
      const numeroDeGruposDuplicados = empleadosDuplicados.length;
      mensajePrincipalFalla = `Nómina con ${numeroDeGruposDuplicados} ${
        numeroDeGruposDuplicados === 1
          ? "grupo de empleados duplicados"
          : "grupos de empleados duplicados"
      }.`;
      listaErroresParaReporte = mensajeErrorUnicidad;
    } else if (tipoError === "ValidacionDetallada") {
      resultadoIntentoEspecifico = "Fallido - Errores de Detalle";
      mensajePrincipalFalla = `Nómina con ${registrosAfectadosCount} ${
        registrosAfectadosCount === 1
          ? "empleado con errores"
          : "empleados con errores"
      } de validación.`;
      listaErroresParaReporte = datosTabla.map((e) => {
        const detalle = Object.entries(e.errores || {})
          .map(([col, razon]) => `${col}: ${razon}`)
          .join("; ");
        return `Documento: ${e.Documento || "N/A"}, Errores: ${detalle}`;
      });
    } else if (tipoError === "Encabezado") {
      resultadoIntentoEspecifico = "Fallido - Error de Encabezado";
      mensajePrincipalFalla = `Error en el encabezado de la nómina: ${mensajeError.join(
        "; "
      )}`;
      listaErroresParaReporte = mensajeError;
    }

    const reporte = {
      UsuarioID,
      NombreUsuario,
      FechaHora,
      ResultadoIntento: resultadoIntentoEspecifico,
      EncabezadoValido: tipoError !== "Encabezado" && mensajeError.length === 0,
      DetalleValido: false,
      CantidadEmpleadosOriginal: cantidadTotalEmpleadosOriginal,
      RegistrosAfectadosPorError: registrosAfectadosCount,
      Anio: anio,
      Mes: mes,
      CodigoOrganismoMAP: codigoOrganismo,
      TipoErrorEspecifico: tipoError,
      MensajePrincipalFalla: mensajePrincipalFalla,
      ListaErroresDetallada: listaErroresParaReporte,
    };
    socket.emit("reporteErrores", reporte);
  };

  /* Transformar empleado para envío */
  const transformarEmpleadoParaEnvio = (
    empleado: any,
    anio: number,
    mes: number,
    fechaCargaDatos: string,
    codigoOrganismo: number
  ): DetalleEmpleado => ({
    Documento: empleado.Documento,
    TipoDocumento: empleado.TipoDocumento,
    Apellidos: empleado.Apellidos,
    Nombres: empleado.Nombres,
    FechaNacimiento: empleado.FechaNacimiento,
    Genero: empleado.Genero,
    TipoEmpleado: empleado.TipoEmpleado,
    CategoriaEmpleado: empleado.CategoriaEmpleado,
    CargoRango: empleado.CargoRango,
    FechaDesignacion: empleado.FechaDesignacion,
    UnidadOrganizacional: empleado.UnidadOrganizacional,
    PoderEstado: empleado.PoderEstado,
    CodigoOrganismoMAP: codigoOrganismo,
    CodigoUnidadOrganizacional: empleado.CodigoUnidadOrganizacional,
    CodigoCargoMAP: empleado.CodigoCargoMAP,
    SueldoBase: empleado.SueldoBase,
    Funcion: empleado.Funcion,
    SueldoFuncion: empleado.SueldoFuncion,
    SFS: empleado.SFS,
    ISR: empleado.ISR,
    AFP: empleado.AFP,
    OtrosDescuentos: empleado.OtrosDescuentos,
    Anio: anio,
    Mes: mes,
    FechaCargaDatos: fechaCargaDatos,
  });

  /* Enviar nómina */
  const handleEnviarNomina = async (): Promise<void> => {
    if (!nominaJsonData) return;

    setIsSending(true);
    setSendingSuccess(false);
    setProgresoTransmision(0);

    const headerAnio = Number(nominaJsonData.Anio);
    const headerMes = Number(nominaJsonData.Mes);
    const headerOrg = Number(nominaJsonData.CodigoOrganismoMAP);
    const fechaCargaDatos = getFechaCargaDatos();

    // Sugerencia aplicada: verificación previa
    console.log("FechaCargaDatos a enviar:", fechaCargaDatos); // debe terminar en -04:00

    const detalleTransformado = nominaJsonData.Detalle.map((emp: any) =>
      transformarEmpleadoParaEnvio(
        emp,
        headerAnio,
        headerMes,
        fechaCargaDatos,
        headerOrg
      )
    );

    const nominaCompleta = {
      UsuarioID: decodedToken?.id ?? null,
      NombreUsuario: decodedToken?.email ?? "",
      FechaHora: fechaCargaDatos,
      ResultadoIntento: "Exitoso",
      EncabezadoValido: true,
      DetalleValido: true,
      CantidadEmpleados: detalleTransformado.length,
      EmpleadosInvalidos: 0,
      Anio: headerAnio,
      Mes: headerMes,
      CodigoOrganismoMAP: headerOrg,
      FechaCargaDatos: fechaCargaDatos,
      Detalle: detalleTransformado,
    };

    const chunks = createNominaChunks(nominaCompleta, 2000);

    try {
      await sendNominaChunks(chunks, (prog) => setProgresoTransmision(prog));
      setSendingSuccess(true);
    } catch (err) {
      console.error("Error en el envío progresivo:", err);
      setErrorMessage("Error en el envío progresivo de la nómina.");
      setIsSending(false);
    }
  };

  // ✅ Correct: use replaceInfo.* inside handleReplace
  const handleReplace = async (): Promise<void> => {
    if (!replaceInfo) return;
    await borrarNomina(
      replaceInfo.anio,
      replaceInfo.mes,
      replaceInfo.org,
      decodedToken?.id ?? null,
      decodedToken?.email ?? "",
      token
    );
    setShowReplaceDialog(false);
    handleEnviarNomina();
  };

  const handleSuccessOk = (): void => {
    setIsSending(false);
    setOpen(false);
    navigate("/menu");
  };

  /* Cargar catálogos (cifrados) */
  useEffect(() => {
    if (!token) {
      setLoadingValidation(true);
      return;
    }

    let alive = true;
    setLoadingValidation(true);
    setProgresoCarga(0);

    (async () => {
      try {
        const { iv, cipher, tag } = await fetchEncryptedValidationData(
          "validation/encrypt",
          uuidKey
        );
        if (!alive) return;
        setProgresoCarga(40);

        const claro = await decryptAES(
          b64ToU8(cipher),
          b64ToU8(iv),
          b64ToU8(tag),
          uuidKey
        );
        if (!alive) return;
        setProgresoCarga(80);

        const json = JSON.parse(new TextDecoder().decode(claro));
        setValidationData(json);
        if (json.organismos) setOrganismos(json.organismos);

        setProgresoCarga(100);
      } catch (err: any) {
        console.error("Error al cargar datos de validación:", err);

        const fallbackData = await fetchValidationData();
        if (!alive) return;

        if (fallbackData) {
          setValidationData(fallbackData);
          if (fallbackData.organismos) setOrganismos(fallbackData.organismos);
          setProgresoCarga(100);
          return;
        }

        const backendMessage =
          err?.response?.data?.error && typeof err.response.data.error === "string"
            ? ` (${err.response.data.error})`
            : "";

        setMensajeError((p) => [
          ...p,
          `Error al descargar datos de validación.${backendMessage}`,
        ]);
      } finally {
        if (alive) setLoadingValidation(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [token, uuidKey]);

  /* Cargar asignaciones rol */
  useEffect(() => {
    if (userRole.toLowerCase() === "institucional" && token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        getUserAssignments()
          .then((assigns) => {
            const filt = assigns.filter((a) => a.UsuarioID === decoded.id);
            setUserAssignments(filt);
            if (filt.length > 0 && !selectedOrganismo) {
              setSelectedOrganismo(filt[0]);
            }
          })
          .catch((error) => {
            console.error("Error fetching user assignments:", error);
          });
      } catch (error) {
        console.error("Error decoding JWT:", error);
      }
    } else if (userRole.toLowerCase() !== "institucional") {
      setUserAssignments([]);
      setSelectedOrganismo(null);
    }
  }, [userRole, token]);

  const instituciones = userAssignments.map((as) => {
    const org = organismos.find((o: any) => o.OrganismoID === as.OrganismoID);
    return { ...as, nombre: org ? org.Nombre : "No encontrado" };
  });

  /* ───────────────── VALIDAR UN EMPLEADO (mapa de razones) ───────────────── */
  const validarEmpleado = (
    empleado: Record<string, any>
  ): { valido: boolean; errores: Record<string, string> } => {
    const err: Record<string, string> = {};

    /* 1. TIPO */
    if (!validateTipo(empleado)) {
      err["TIPO"] = "Debe ser 'C' (Cédula) o 'P' (Pasaporte)";
    }

    /* 2. DOCUMENTO */
    {
      const tipo = String(empleado.TipoDocumento ?? "").trim();
      const doc = String(empleado.Documento ?? "").trim();
      if (tipo === "C") {
        if (doc === "") err["DOCUMENTO"] = "Obligatorio";
        else if (!/^\d+$/.test(doc))
          err[
            "DOCUMENTO"
          ] = `La cédula solo acepta dígitos sin guiones (actual: ${doc})`;
        else if (doc.length !== 11)
          err[
            "DOCUMENTO"
          ] = `La cédula debe tener 11 dígitos (actual: ${doc.length})`;
      } else if (tipo === "P") {
        if (doc === "") err["DOCUMENTO"] = "Obligatorio";
      } else {
        if (!err["TIPO"]) err["TIPO"] = "Tipo de documento inválido";
        if (doc === "") err["DOCUMENTO"] = "Obligatorio";
      }
    }

    /* 3. NOMBRES */
    if (!validateNombres(empleado)) {
      const v = String(empleado.Nombres ?? "").trim();
      if (v === "") err["NOMBRES"] = "Campo obligatorio";
      else if (/^\d+$/.test(v))
        err["NOMBRES"] = `No puede ser numérico (valor: ${v})`;
      else if (v.length > 40)
        err["NOMBRES"] = `Máx. 40 caracteres (actual: ${v.length})`;
      else err["NOMBRES"] = "Valor inválido";
    }

    /* 4. APELLIDOS */
    if (!validateApellidos(empleado)) {
      const v = String(empleado.Apellidos ?? "").trim();
      if (v === "") err["APELLIDOS"] = "Campo obligatorio";
      else if (/^\d+$/.test(v))
        err["APELLIDOS"] = `No puede ser numérico (valor: ${v})`;
      else if (v.length > 40)
        err["APELLIDOS"] = `Máx. 40 caracteres (actual: ${v.length})`;
      else err["APELLIDOS"] = "Valor inválido";
    }

    /* 5. PODER DEL ESTADO */
    if (!validatePoderEstado(empleado, validationData?.nivelGobierno || []))
      err["PODER DEL ESTADO"] = "No pertenece al catálogo";

    /* 6. GÉNERO */
    if (!validateGenero(empleado))
      err["GENERO"] = "Debe ser 'M' o 'F' y no estar vacío";

    /* 7. FECHA DE NACIMIENTO */
    if (!validateFechaNacimiento(empleado)) {
      const v = String(empleado.FechaNacimiento ?? "");
      err[
        "FECHA DE NACIMIENTO"
      ] = `Fecha inválida o la persona es menor de 18 años (valor: ${v})`;
    }

    /* 8. CARGO O RANGO */
    if (!validateCargoRango(empleado)) {
      const v = String(empleado.CargoRango ?? "").trim();
      if (v === "") err["CARGO O RANGO"] = "Campo obligatorio";
      else if (/^\d+$/.test(v))
        err["CARGO O RANGO"] = `No puede ser numérico (valor: ${v})`;
      else if (v.length > 60)
        err["CARGO O RANGO"] = `Máx. 60 caracteres (actual: ${v.length})`;
      else err["CARGO O RANGO"] = "Valor inválido";
    }

    /* 9. FECHA DESIGNACIÓN */
    if (!validateFechaDesignacion(empleado)) {
      const v = String(empleado.FechaDesignacion ?? "");
      err[
        "FECHA DESIGNACIÓN"
      ] = `Formato DD-MM-AAAA válido y no futura (valor: ${v})`;
    }

    /* 10. TIPO DE EMPLEADO */
    if (!validateTipoEmpleado(empleado, validationData?.tiposEmpleados || []))
      err["TIPO DE EMPLEADO"] = "No pertenece al catálogo";

    /* 11. UNIDAD ORGANIZACIONAL */
    if (!validateUnidadOrganizacional(empleado)) {
      const v = String(empleado.UnidadOrganizacional ?? "").trim();
      if (v === "") err["UNIDAD ORGANIZACIONAL"] = "Campo obligatorio";
      else if (v.length > 60)
        err[
          "UNIDAD ORGANIZACIONAL"
        ] = `Máx. 60 caracteres (actual: ${v.length})`;
      else err["UNIDAD ORGANIZACIONAL"] = "Valor inválido";
    }

    /* 12. SUELDO BASE */
    if (!validateSueldoBase(empleado))
      err["SUELDO BASE"] = `Debe ser numérico > 0 (valor: ${
        empleado.SueldoBase ?? "vacío"
      })`;

    /* 13. FUNCIÓN */
    if (!validateFuncion(empleado)) {
      const v = String(empleado.Funcion ?? "").trim();
      if (v === "") err["FUNCIÓN"] = "Campo obligatorio si se provee contexto";
      else if (/^[+-]?\d+(\.\d+)?$/.test(v))
        err["FUNCIÓN"] = `No puede ser numérica (valor: ${v})`;
      else if (v.length > 50)
        err["FUNCIÓN"] = `Máx. 50 caracteres (actual: ${v.length})`;
      else err["FUNCIÓN"] = "Valor inválido";
    }

    /* 14. SUELDO FUNCIÓN */
    if (!validateSueldoFuncion(empleado))
      err["SUELDO FUNCIÓN"] = `Numérico ≥ 0 (valor: ${
        empleado.SueldoFuncion ?? "vacío"
      })`;

    /* 15. SFS */
    if (!validateSFS(empleado))
      err["SFS"] = `Numérico ${
        Number(empleado.TipoEmpleado) === 3 ? "≥ 0" : "> 0"
      } (valor: ${empleado.SFS ?? "vacío"})`;

    /* 16. AFP */
    if (!validateAFP(empleado))
      err["AFP"] = `Numérico ${
        Number(empleado.TipoEmpleado) === 3 ? "≥ 0" : "> 0"
      } (valor: ${empleado.AFP ?? "vacío"})`;

    /* 17. ISR */
    if (!validateISR(empleado))
      err["ISR"] = `Numérico ≥ 0 (valor: ${empleado.ISR ?? "vacío"})`;

    /* 18. CÓDIGO UNIDAD ORGANIZACIONAL */
    if (
      !validateCodigoUnidadOrganizacional(
        empleado,
        validationData?.catalogo || []
      )
    ) {
      if (Number(empleado.PoderEstado) === 4)
        err["CÓDIGO UNIDAD ORGANIZACIONAL"] =
          "Debe existir en catálogo y ser numérico válido";
      else
        err["CÓDIGO UNIDAD ORGANIZACIONAL"] =
          "Para este Poder del Estado debe ser 0";
    }

    /* 19. CÓDIGO CARGO O RANGO */
    if (!validateCodigoCargoRango(empleado))
      err["CÓDIGO CARGO O RANGO"] = "Debe ser exactamente 0";

    /* 20. OTROS DESCUENTOS */
    if (!validateOtrosDescuentos(empleado))
      err["OTROS DESCUENTOS"] = `Numérico ≥ 0 (valor: ${
        empleado.OtrosDescuentos ?? "vacío"
      })`;

    /* 21. CATEGORIA EMPLEADO */
    if (
      !validateCategoriaEmpleado(
        empleado,
        validationData?.categoriaEmpleados || []
      )
    ) {
      if (Number(empleado.TipoEmpleado) === 3)
        err["CATEGORIA EMPLEADO"] = "Debe ser 0 para TipoEmpleado 3";
      else err["CATEGORIA EMPLEADO"] = "No pertenece al catálogo";
    }

    return { valido: Object.keys(err).length === 0, errores: err };
  };

  /* ──────────────── Validación lote ──────────────── */
  const validarEmpleados = async (
    empleados: any[],
    anio: number,
    mes: number,
    org: number,
    totalEmpsOriginal: number
  ): Promise<void> => {
    setValidacionEnCurso(true);
    const tot = empleados.length;
    const inv: EmpleadoTransformado[] = [];

    for (let i = 0; i < tot; i++) {
      const { valido, errores } = validarEmpleado(empleados[i]);
      if (!valido) inv.push(transformarEmpleado(empleados[i], errores));
      const iter = i + 1;
      if (iter % Math.max(1, Math.floor(tot / 100)) === 0 || iter === tot) {
        setProgresoValidacion(Math.round((iter / tot) * 100));
        await new Promise((r) => requestAnimationFrame(r));
      }
    }

    setDatosTabla(inv);
    setEmpleadosInvalidosCount(inv.length);
    setEmpleadosValidosCount(tot - inv.length);
    setValidacionEnCurso(false);
    setValidacionCompletada(true);

    if (inv.length > 0) {
      enviarReporteErrores(
        anio,
        mes,
        org,
        inv.length,
        totalEmpsOriginal,
        "ValidacionDetallada"
      );
    }
  };

  /* ──────────────── Manejar archivo JSON ──────────────── */
  const manejarCambioArchivo = async (
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    setMensajeError([]);
    setProgresoCarga(0);
    setMostrandoProgreso(false);
    setDatosTabla([]);
    setEmpleadosInvalidosCount(0);
    setEmpleadosValidosCount(0);
    setValidacionEnCurso(false);
    setValidacionCompletada(false);
    setAnioNomina(null);
    setMesNomina(null);
    setOrganismoNomina(null);
    setNominaJsonData(null);
    setProgresoUnicidad(0);
    setUnicidadEnCurso(false);
    setEmpleadosDuplicados([]);
    setMensajeErrorUnicidad([]);

    const archivo = event.target.files?.[0];
    if (!archivo) return;
    if (!validationData) {
      setMensajeError([
        "No se puede validar la nómina sin catálogos de validación cargados.",
      ]);
      event.target.value = "";
      return;
    }

    if (archivo.type !== "application/json") {
      setMensajeError(["El archivo debe ser un JSON válido."]);
      enviarReporteErrores(null, null, null, 0, 0, "Encabezado");
      event.target.value = "";
      return;
    }

    const lector = new FileReader();
    lector.onloadstart = () => {
      setMostrandoProgreso(true);
      setProgresoCarga(0);
    };
    lector.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgresoCarga(Math.round((e.loaded / e.total) * 100));
      }
    };
    lector.onload = async () => {
      try {
        if (typeof lector.result !== "string") {
          throw new Error("Error al leer texto del archivo.");
        }

        // ────────────────────────────────────────────────────────────────
        // BLOQUE SUSTITUIDO (desde 'const raw = JSON.parse...' hasta 'setNominaJsonData(datos);')
        // ────────────────────────────────────────────────────────────────
        const raw = JSON.parse(lector.result);

        // Strict structural validation (exact field names & shapes)
        // Strict structural validation (exact field names & shapes)
        type ValidShape = {
          valido?: boolean;
          ok?: boolean;
          isValid?: boolean;
          errores?: string[];
          errors?: string[];
          mensajes?: string[];
        };

        const r = verificarEstructuraNomina(raw) as unknown as ValidShape;

        const estructuraOk = r.valido ?? r.ok ?? r.isValid ?? false;

        const erroresEstructura: string[] =
          r.errores ?? r.errors ?? r.mensajes ?? [];

        if (!estructuraOk) {
          setMensajeError([
            "Estructura de JSON inválida. Corrija los nombres de campos/elementos.",
            ...erroresEstructura,
          ]);

          const anioHeader = Number((raw as any)?.Anio ?? NaN);
          const mesHeader = Number((raw as any)?.Mes ?? NaN);
          const orgHeader = Number((raw as any)?.CodigoOrganismoMAP ?? NaN);
          const totalEmpsHeader = Array.isArray((raw as any)?.Detalle)
            ? (raw as any).Detalle.length
            : 0;

          enviarReporteErrores(
            Number.isFinite(anioHeader) ? anioHeader : null,
            Number.isFinite(mesHeader) ? mesHeader : null,
            Number.isFinite(orgHeader) ? orgHeader : null,
            0,
            totalEmpsHeader,
            "Encabezado"
          );
          return;
        }

        // Continue with original flow using the case-insensitive proxy
        const datos = createCaseInsensitiveProxy(raw);
        setNominaJsonData(datos);
        // ────────────────────────────────────────────────────────────────
        // FIN BLOQUE SUSTITUIDO
        // ────────────────────────────────────────────────────────────────

        const anio = Number(datos.Anio);
        const mes = Number(datos.Mes);
        const org = Number(datos.CodigoOrganismoMAP);
        const detalleEmpleados = Array.isArray(datos.Detalle)
          ? datos.Detalle
          : [];
        const totalEmpsOriginal = detalleEmpleados.length;

        const errsEncabezado: string[] = [];
        if (
          !datos.Anio ||
          !datos.Mes ||
          !datos.CodigoOrganismoMAP ||
          !datos.Detalle
        ) {
          errsEncabezado.push(
            "JSON debe tener Anio, Mes, CodigoOrganismoMAP y Detalle (arreglo de empleados)."
          );
        }
        const ay = new Date().getFullYear();
        if (isNaN(anio) || anio < ay - 2 || anio > ay + 1)
          errsEncabezado.push(
            `Año inválido: ${anio}. Debe estar entre ${ay - 2} y ${ay + 1}.`
          );
        if (isNaN(mes) || mes < 1 || mes > 12)
          errsEncabezado.push(`Mes inválido: ${mes}. Debe estar entre 1 y 12.`);
        if (isNaN(org) || org <= 0)
          errsEncabezado.push(`Código de Organismo inválido: ${org}.`);

        if (!Array.isArray(datos.Detalle)) {
          errsEncabezado.push(
            "El campo 'Detalle' debe ser un arreglo de empleados."
          );
        }

        if (userRole.toLowerCase() === "institucional") {
          const ok = userAssignments.some((a) => a.OrganismoID === org);
          if (!ok)
            errsEncabezado.push(`Organismo ${org} no asignado a tu usuario.`);
        }

        if (errsEncabezado.length > 0) {
          setMensajeError(errsEncabezado);
          enviarReporteErrores(
            anio,
            mes,
            org,
            0,
            totalEmpsOriginal,
            "Encabezado"
          );
          return;
        }
        setMensajeError([]);

        setAnioNomina(anio);
        setMesNomina(mes);
        setOrganismoNomina(org);
        setProgresoCarga(100);

        /* Unicidad */
        setUnicidadEnCurso(true);
        setProgresoUnicidad(0);

        const resultadoUnicidad = await validarUnicidad(
          detalleEmpleados,
          (prog) => {
            setProgresoUnicidad(prog);
          }
        );
        setUnicidadEnCurso(false);

        if (resultadoUnicidad.duplicados.length > 0) {
          setEmpleadosDuplicados(resultadoUnicidad.duplicados);
          const erroresUnicidadMsg: string[] = [
            `Se han encontrado ${resultadoUnicidad.duplicados.length} ${
              resultadoUnicidad.duplicados.length === 1
                ? "grupo de empleados duplicados"
                : "grupos de empleados duplicados"
            } por número de Cédula/Pasaporte:`,
          ];
          resultadoUnicidad.duplicados.forEach((dup) => {
            erroresUnicidadMsg.push(
              `Documento: ${dup.Documento} (${dup.Nombres} ${
                dup.Apellidos
              }) - ${dup.indices.length} ${
                dup.indices.length === 1 ? "vez" : "veces"
              }`
            );
          });
          setMensajeErrorUnicidad(erroresUnicidadMsg);

          const totalRegistrosImplicadosEnDuplicados =
            resultadoUnicidad.duplicados.reduce(
              (sum, d) => sum + d.indices.length,
              0
            );
          enviarReporteErrores(
            anio,
            mes,
            org,
            totalRegistrosImplicadosEnDuplicados,
            totalEmpsOriginal,
            "Unicidad"
          );
          return;
        }
        setMensajeErrorUnicidad([]);

        if (totalEmpsOriginal > 0) {
          validarEmpleados(detalleEmpleados, anio, mes, org, totalEmpsOriginal);
        } else {
          setValidacionCompletada(true);
          setEmpleadosInvalidosCount(0);
          setEmpleadosValidosCount(0);
        }
      } catch (err: any) {
        setMensajeError([traducirErrorJSON(err.message)]);
        enviarReporteErrores(null, null, null, 0, 0, "Encabezado");
      } finally {
        setMostrandoProgreso(false);
      }
    };
    lector.onerror = () => {
      setMensajeError(["Error al leer archivo JSON."]);
      setMostrandoProgreso(false);
      enviarReporteErrores(null, null, null, 0, 0, "Encabezado");
    };
    lector.readAsText(archivo);
    event.target.value = "";
  };

  /* ───────────────────────── JSX UI ───────────────────────── */
  return (
    <>
      <Dialog
        open={open}
        fullWidth
        maxWidth="lg"
        sx={{
          "& .MuiDialog-paper": {
            border: "2px solid black",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            backgroundColor: "#003876",
            color: "white",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CloudUpload sx={{ fontSize: 30 }} />
            Subir JSON de nómina
          </Box>
          <Button
            variant="contained"
            onClick={() => {
              setOpen(false);
              setMensajeError([]);
              setProgresoCarga(0);
              setMostrandoProgreso(false);
              setDatosTabla([]);
              setEmpleadosInvalidosCount(0);
              setEmpleadosValidosCount(0);
              setValidacionEnCurso(false);
              setValidacionCompletada(false);
              setAnioNomina(null);
              setMesNomina(null);
              setOrganismoNomina(null);
              setNominaJsonData(null);
              setProgresoUnicidad(0);
              setUnicidadEnCurso(false);
              setEmpleadosDuplicados([]);
              setMensajeErrorUnicidad([]);
              setIsSending(false);
              setSendingSuccess(false);
              setErrorMessage(null);
            }}
            sx={{
              backgroundColor: "white",
              color: "#003876",
              border: "1px solid #003876",
              "&:hover": { backgroundColor: "#EE2A24", color: "white" },
              fontSize: "0.875rem",
              fontWeight: "bold",
              px: 2,
            }}
          >
            SALIR
          </Button>
        </DialogTitle>

        <DialogContent
          sx={{ p: 3, backgroundColor: "#FFFFFF", overflow: "auto" }}
        >
          {loadingValidation ? (
            <Box sx={{ width: "100%", textAlign: "center", mb: 2 }}>
              <Typography variant="h6">
                Cargando datos de validación… {progresoCarga}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progresoCarga}
                sx={{
                  backgroundColor: "#EEEEEE",
                  "& .MuiLinearProgress-bar": { backgroundColor: "#003876" },
                }}
              />
            </Box>
          ) : (
            <>
              {userRole.toLowerCase() === "institucional" &&
                instituciones.length > 0 && (
                  <Box sx={{ my: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel id="organismo-label">Institución</InputLabel>
                      <Select
                        labelId="organismo-label"
                        value={selectedOrganismo?.OrganismoID || ""}
                        label="Institución"
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          setSelectedOrganismo(
                            instituciones.find((i) => i.OrganismoID === id) ||
                              null
                          );
                        }}
                      >
                        {instituciones.map((i) => (
                          <MenuItem key={i.OrganismoID} value={i.OrganismoID}>
                            {i.OrganismoID} - {i.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

              <Box sx={{ my: 2 }}>
                <Button
                  variant="contained"
                  component="label"
                  disabled={loadingValidation || !validationData}
                  sx={{
                    backgroundColor: "#003876",
                    color: "white",
                    "&:hover": { backgroundColor: "#EE2A24" },
                    "&.Mui-disabled": {
                      backgroundColor: "#8aa2c4",
                      color: "#f5f5f5",
                    },
                  }}
                >
                  Subir JSON
                  <input
                    type="file"
                    accept=".json"
                    hidden
                    onChange={manejarCambioArchivo}
                    ref={fileInputRef}
                  />
                </Button>
              </Box>

              {mensajeError.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {mensajeError.map((e, idx) => (
                    <Typography
                      key={idx}
                      variant="body2"
                      sx={{
                        color: "#EE2A24",
                        fontWeight: "bold",
                        fontSize: "1.5rem",
                        whiteSpace: "pre-line",
                      }}
                    >
                      {e}
                    </Typography>
                  ))}
                </Box>
              )}

              {mostrandoProgreso && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Progreso de carga: {progresoCarga}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={progresoCarga}
                    sx={{
                      backgroundColor: "#EEEEEE",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: "#003876",
                      },
                    }}
                  />
                </Box>
              )}

              {unicidadEnCurso && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Validando la unicidad de los empleados: {progresoUnicidad}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={progresoUnicidad}
                    sx={{
                      backgroundColor: "#EEEEEE",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: "#003876",
                      },
                    }}
                  />
                </Box>
              )}

              {mensajeErrorUnicidad.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {mensajeErrorUnicidad.map((e, idx) => (
                    <Typography
                      key={idx}
                      variant="body2"
                      sx={{
                        color: "#EE2A24",
                        fontWeight: idx === 0 ? "bold" : "normal",
                        fontSize: idx === 0 ? "1.2rem" : "1rem",
                        whiteSpace: "pre-line",
                        ml: idx > 0 ? 2 : 0,
                      }}
                    >
                      {e}
                    </Typography>
                  ))}
                </Box>
              )}

              {validacionEnCurso && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Validando Empleados (detalle): {progresoValidacion}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={progresoValidacion}
                    sx={{
                      backgroundColor: "#EEEEEE",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: "#003876",
                      },
                    }}
                  />
                </Box>
              )}

              {validacionCompletada &&
                !unicidadEnCurso &&
                empleadosDuplicados.length === 0 &&
                empleadosInvalidosCount > 0 && (
                  <TablaErroresEmpleados datosTabla={datosTabla} />
                )}

              {validacionCompletada &&
                !unicidadEnCurso &&
                empleadosDuplicados.length === 0 &&
                empleadosInvalidosCount === 0 &&
                mensajeError.length === 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "bold",
                        fontSize: "2.25rem",
                        color: "#28A745",
                      }}
                    >
                      La nómina no contiene errores de validación
                      {nominaJsonData?.Detalle?.length === 0 &&
                        empleadosValidosCount === 0 &&
                        " (Nómina vacía)"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: "bold", fontSize: "1.5rem" }}
                    >
                      {`Cantidad de empleados: ${empleadosValidosCount.toLocaleString(
                        "en-US"
                      )}`}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Año de la nómina: {anioNomina ?? "No especificado"}
                    </Typography>
                    <Typography variant="body2">
                      Mes de la nómina: {mesNomina ?? "No especificado"}
                    </Typography>
                    <Typography variant="body2">
                      Organismo nómina: {organismoNomina ?? "No especificado"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mt: 1, fontSize: "0.875rem", color: "#555" }}
                    >
                      Fecha y hora: {new Date().toLocaleString()}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={async () => {
                          if (!nominaJsonData) return;
                          const esNominaOriginalmenteVacia =
                            nominaJsonData.Detalle &&
                            nominaJsonData.Detalle.length === 0;
                          if (
                            esNominaOriginalmenteVacia ||
                            empleadosValidosCount > 0
                          ) {
                            const anio = Number(nominaJsonData.Anio);
                            const mes = Number(nominaJsonData.Mes);
                            const org = Number(
                              nominaJsonData.CodigoOrganismoMAP
                            );
                            const existe = await existeNomina(
                              anio,
                              mes,
                              org,
                              token
                            );
                            if (existe) {
                              setReplaceInfo({ anio, mes, org });
                              setShowReplaceDialog(true);
                            } else {
                              handleEnviarNomina();
                            }
                          }
                        }}
                        sx={{
                          backgroundColor: "#003876",
                          "&:hover": { backgroundColor: "#EE2A24" },
                        }}
                        disabled={
                          !nominaJsonData ||
                          (empleadosValidosCount === 0 &&
                            nominaJsonData?.Detalle?.length > 0)
                        }
                      >
                        ENVIAR NÓMINA
                      </Button>
                    </Box>
                  </Box>
                )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogos de reemplazo, envío y error — sin cambios de lógica relevante */}
      <Dialog
        open={showReplaceDialog}
        onClose={() => setShowReplaceDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: "#003876",
            color: "#FFFFFF",
          },
        }}
      >
        <DialogContent>
          <Typography sx={{ textAlign: "center", mb: 2 }}>
            ESA NOMINA YA EXISTE <br />
            {replaceInfo?.anio}-{replaceInfo?.mes} organismo {replaceInfo?.org}.
            <br />
            ¿Desea eliminarla y cargar la nueva?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowReplaceDialog(false)}
            sx={{
              backgroundColor: "#FFFFFF",
              color: "#003876",
              "&:hover": {
                backgroundColor: "#EE2A24",
                color: "#FFFFFF",
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleReplace}
            sx={{
              backgroundColor: "#FFFFFF",
              color: "#003876",
              "&:hover": {
                backgroundColor: "#EE2A24",
                color: "#FFFFFF",
              },
            }}
          >
            Sustituir
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isSending}
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: "#003876",
            color: "#FFFFFF",
          },
        }}
      >
        {!sendingSuccess ? (
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">
                Transmitiendo nómina, no cierre el navegador
              </Typography>
              <Box sx={{ my: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={progresoTransmision}
                  sx={{
                    backgroundColor: "#F4F4F4",
                    "& .MuiLinearProgress-bar": { backgroundColor: "#003876" },
                  }}
                />
                <Typography variant="body2" sx={{ textAlign: "center", mt: 1 }}>
                  {progresoTransmision}% - {mensajeProgreso}
                </Typography>
              </Box>
            </Box>
          </DialogContent>
        ) : (
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Nómina cargada exitosamente</Typography>
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSuccessOk}
                  sx={{
                    backgroundColor: "#FFFFFF",
                    color: "#003876",
                    "&:hover": {
                      backgroundColor: "#EE2A24",
                      color: "#FFFFFF",
                    },
                  }}
                >
                  OK
                </Button>
              </Box>
            </Box>
          </DialogContent>
        )}
      </Dialog>

      <Dialog
        open={!!errorMessage && !isSending}
        onClose={() => setErrorMessage(null)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: "#EE2A24",
            color: "#FFFFFF",
          },
        }}
      >
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ textAlign: "center", lineHeight: 1 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#FFFFFF", lineHeight: 1 }}
            >
              LA NOMINA NO SE PUDO ENVIAR
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#FFFFFF", lineHeight: 1 }}
            >
              <br />
              {errorMessage}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#FFFFFF", lineHeight: 1 }}
            >
              Comuníquese con la Mesa de ayuda.
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Button
                variant="contained"
                onClick={() => setErrorMessage(null)}
                sx={{
                  backgroundColor: "#FFFFFF",
                  color: "#EE2A24",
                  "&:hover": {
                    backgroundColor: "#003876",
                    color: "#FFFFFF",
                  },
                }}
              >
                OK
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SubirNominaJSON;
