/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// frontend/src/components/reporteNomina/ReporteNominaPage.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogActions,
  DialogContent,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useDispatch, useSelector } from "react-redux";
import {
  loadOrganismos,
  loadPorMes,
  clearDatos,
} from "../../slices/reporteNominaSlice";
import {
  loadNominaResumida,
  clearDatosResumida,
} from "../../slices/nominaResumidaSlice";
import type { RootState, AppDispatch } from "../../store";
import ReporteNominaDownloadButton from "./ReporteNominaDownloadButton";
import ReporteNominaResumidaDownloadButton from "./NominaResumidaDownloadButton";

// Panel “Poder del Estado” controlado por el padre
import PoderNominaResumidaPanel from "./PoderNominaResumidaPanel";

const BTN_STYLE = {
  backgroundColor: "#003876",
  color: "#fff",
  "&:hover": { backgroundColor: "#002b5a" },
};

const ReporteNominaPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  /* ── Estado GLOBAL para “Por Organismo” ───────────────────────────── */
  const { organismos, datos, loadingOrganismos, loadingDatos, error } =
    useSelector((state: RootState) => state.reporteNomina);

  /* ── Estado GLOBAL para “Resumida por Organismo” ──────────────────── */
  const {
    datos: datosNR,
    loading: loadingNR,
    error: errorNR,
  } = useSelector((state: RootState) => state.nominaResumida);

  /* ── Filtros (Organismo) ──────────────────────────────────────────── */
  const [organismoId, setOrganismoId] = useState<number | "">("");
  const [year, setYear] = useState<string>("");
  const [mes, setMes] = useState<string>("");
  const [tipoNominaOrg, setTipoNominaOrg] = useState<
    "GENERAL" | "RESUMIDA" | ""
  >("");

  /* ── UI: acordeones y diálogo “sin datos” ─────────────────────────── */
  // Control centralizado: solo un panel abierto a la vez
  const [expandedPanel, setExpandedPanel] = useState<
    "organismo" | "poder" | false
  >("organismo");

  const [openNoDataDialog, setOpenNoDataDialog] = useState(false);
  const [searchTriggeredOrg, setSearchTriggeredOrg] = useState(false);
  const [searchTriggeredNR, setSearchTriggeredNR] = useState(false); // para RESUMIDA por organismo

  const handleChangeAccordion =
    (panel: "organismo" | "poder") =>
    (_e: React.SyntheticEvent, isExpanded: boolean) =>
      setExpandedPanel(isExpanded ? panel : false);

  /* ── Cargar organismos al montar ──────────────────────────────────── */
  useEffect(() => {
    dispatch(loadOrganismos());
  }, [dispatch]);

  /* ── Limpiar datos al cambiar filtros del panel Organismo ─────────── */
  useEffect(() => {
    dispatch(clearDatos());
    dispatch(clearDatosResumida());
  }, [organismoId, year, mes, tipoNominaOrg, dispatch]);

  /* ── Buscar (Organismo → GENERAL/RESUMIDA) ────────────────────────── */
  const handleBuscarOrganismo = () => {
    const yearOk = /^\d{4}$/.test(year);
    const mesOk = /^\d{1,2}$/.test(mes);
    if (!organismoId || !tipoNominaOrg || !yearOk || !mesOk) return;

    if (tipoNominaOrg === "RESUMIDA") {
      // Nómina RESUMIDA por ORGANISMO (usa slice nominaResumida)
      dispatch(
        loadNominaResumida({
          year: parseInt(year, 10),
          mes: parseInt(mes, 10),
          organismoId: organismoId as number,
        })
      );
      setSearchTriggeredNR(true);
    } else {
      // Nómina GENERAL por ORGANISMO
      dispatch(
        loadPorMes({
          organismoId: organismoId as number,
          year: parseInt(year, 10),
          mes: parseInt(mes, 10),
        })
      );
      setSearchTriggeredOrg(true);
    }
  };

  /* ── Diálogo si no hay resultados (solo Organismo) ────────────────── */
  useEffect(() => {
    if (searchTriggeredOrg && !loadingDatos) {
      if (datos.length === 0) setOpenNoDataDialog(true);
      setSearchTriggeredOrg(false);
    }
  }, [searchTriggeredOrg, loadingDatos, datos]);

  useEffect(() => {
    if (searchTriggeredNR && !loadingNR) {
      if (datosNR.length === 0) setOpenNoDataDialog(true);
      setSearchTriggeredNR(false);
    }
  }, [searchTriggeredNR, loadingNR, datosNR]);

  const handleCloseDialog = () => setOpenNoDataDialog(false);

  /* ── Validaciones ─────────────────────────────────────────────────── */
  const currentYear = new Date().getFullYear();
  const isYearValidOrg =
    /^\d{4}$/.test(year) && +year >= 2021 && +year <= currentYear;
  const isMesValidOrg = /^\d{1,2}$/.test(mes) && +mes >= 1 && +mes <= 12;

  const isLoadingOrgPanel =
    tipoNominaOrg === "RESUMIDA" ? loadingNR : loadingDatos;

  const isBuscarDisabled =
    loadingOrganismos ||
    isLoadingOrgPanel ||
    !organismoId ||
    !tipoNominaOrg ||
    !isYearValidOrg ||
    !isMesValidOrg;

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <>
      <Box p={4} display="flex" flexDirection="column" gap={2}>
        {/* ──────────── POR ORGANISMO (GENERAL | RESUMIDA) ──────────── */}
        <Accordion
          expanded={expandedPanel === "organismo"}
          onChange={handleChangeAccordion("organismo")}
          sx={{ backgroundColor: "#f5f5f5" }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: "#fff" }} />}
            sx={{ backgroundColor: "#003876", color: "#fff", borderRadius: 2 }}
          >
            <Typography variant="h5">Organismo</Typography>
          </AccordionSummary>

          <AccordionDetails>
            {error && (
              <Typography color="error" gutterBottom>
                {error}
              </Typography>
            )}
            {errorNR && (
              <Typography color="error" gutterBottom>
                {errorNR}
              </Typography>
            )}

            <Box display="flex" flexDirection="column" gap={2} mb={2}>
              {/* Organismo */}
              <TextField
                select
                size="small"
                label="Organismo"
                variant="outlined"
                value={organismoId}
                onChange={(e) =>
                  setOrganismoId(parseInt(e.target.value as string, 10))
                }
                disabled={loadingOrganismos}
                sx={{ width: 300 }}
              >
                {organismos.map((o) => (
                  <MenuItem key={o.Codigo} value={o.Codigo}>
                    {o.Nombre}
                  </MenuItem>
                ))}
              </TextField>

              {/* Tipo de Nómina (GENERAL | RESUMIDA) */}
              <FormControl size="small" sx={{ width: 300 }}>
                <InputLabel>Tipo de nómina</InputLabel>
                <Select
                  value={tipoNominaOrg}
                  label="Tipo de nómina"
                  onChange={(e) =>
                    setTipoNominaOrg(e.target.value as "GENERAL" | "RESUMIDA")
                  }
                  disabled={!organismoId}
                >
                  <MenuItem value="GENERAL">GENERAL</MenuItem>
                  <MenuItem value="RESUMIDA">RESUMIDA</MenuItem>
                </Select>
              </FormControl>

              {/* Año */}
              <TextField
                label="Año"
                variant="outlined"
                size="small"
                value={year}
                disabled={!organismoId}
                error={!isYearValidOrg && year !== ""}
                onChange={(e) => {
                  const onlyNums = e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 4);
                  setYear(onlyNums);
                  if (!isYearValidOrg) setMes("");
                }}
                inputProps={{ maxLength: 4 }}
                sx={{ width: 300 }}
              />

              {/* Mes */}
              <TextField
                label="Mes"
                variant="outlined"
                size="small"
                value={mes}
                disabled={!isYearValidOrg}
                error={!isMesValidOrg && mes !== ""}
                onChange={(e) =>
                  setMes(e.target.value.replace(/\D/g, "").slice(0, 2))
                }
                inputProps={{ maxLength: 2 }}
                sx={{ width: 300 }}
              />

              {/* Buscar */}
              <Button
                variant="contained"
                onClick={handleBuscarOrganismo}
                disabled={isBuscarDisabled}
                sx={{ ...BTN_STYLE, width: 180 }}
              >
                {isLoadingOrgPanel ? "Cargando..." : "Buscar"}
              </Button>
            </Box>

            {/* Botones de descarga según tipo */}
            {tipoNominaOrg === "GENERAL" ? (
              <ReporteNominaDownloadButton
                datos={datos}
                disabled={datos.length === 0}
                organismoId={organismoId as number}
                year={parseInt(year, 10)}
                mes={parseInt(mes, 10)}
              />
            ) : (
              <ReporteNominaResumidaDownloadButton
                datos={datosNR}
                disabled={datosNR.length === 0}
                year={parseInt(year, 10)}
                mes={parseInt(mes, 10)}
                organismoId={organismoId as number} // PDF reflejará filtro
              />
            )}
          </AccordionDetails>
        </Accordion>

        {/* Si quieres mantener la línea divisoria, descomenta:
        <Divider sx={{ my: 2 }} />
        */}

        {/* ──────────── PODER DEL ESTADO (controlado por el padre) ──────────── */}
        <PoderNominaResumidaPanel
          expanded={expandedPanel === "poder"}
          onToggle={(isOpen) => setExpandedPanel(isOpen ? "poder" : false)}
        />
      </Box>

      {/* ----------- Diálogo: Sin datos (solo para búsquedas de Organismo) ----------- */}
      <Dialog
        open={openNoDataDialog}
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            backgroundColor: "#003876",
            color: "#fff",
            textAlign: "center",
            p: 3,
          },
        }}
      >
        <DialogContent sx={{ pb: 0 }}>
          <Typography>No se encontraron nóminas con esos parámetros</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              backgroundColor: "#fff",
              color: "#003876",
              "&:hover": { backgroundColor: "#e0e0e0" },
              px: 4,
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReporteNominaPage;
