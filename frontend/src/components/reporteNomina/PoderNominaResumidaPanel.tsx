/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// frontend/src/components/reporteNomina/PoderNominaResumidaPanel.tsx
import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// Hooks tipados del proyecto
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";

// Tipos y acciones del slice
import {
  clearNominaResumidaPoder,
  loadNominaResumidaPorPoder,
  type PoderNombreLargo,
} from "../../slices/nominaResumidaPoderSlice";

import PoderNominaResumidaDownloadButton from "./PoderNominaResumidaDownloadButton";

const BTN_STYLE = {
  backgroundColor: "#003876",
  color: "#fff",
  "&:hover": { backgroundColor: "#002b5a" },
};

type Props = {
  expanded: boolean;
  onToggle: (isExpanded: boolean) => void;
};

const PoderNominaResumidaPanel: React.FC<Props> = ({ expanded, onToggle }) => {
  const dispatch = useAppDispatch();
  const { datos, loading, error } = useAppSelector(
    (s) => s.nominaResumidaPoder
  );

  // Tipo de usuario (para ocultar completamente el acordeón)
  const userType = useAppSelector((s) => s.auth.user?.TipoUsuario);

  // Tipamos poder como union con vacío para estado inicial
  const [poder, setPoder] = useState<PoderNombreLargo | "">("");
  const [year, setYear] = useState<string>("");
  const [mes, setMes] = useState<string>("");

  const [openNoDataDialog, setOpenNoDataDialog] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);

  const currentYear = new Date().getFullYear();
  const isYearValid =
    /^\d{4}$/.test(year) && +year >= 2021 && +year <= currentYear;
  const isMesValid = /^\d{1,2}$/.test(mes) && +mes >= 1 && +mes <= 12;
  const isBuscarDisabled =
    loading || poder === "" || !isYearValid || !isMesValid;

  // Limpia resultados cuando cambian filtros
  useEffect(() => {
    dispatch(clearNominaResumidaPoder());
  }, [dispatch, poder, year, mes]);

  // Muestra diálogo si no hay datos tras una búsqueda
  useEffect(() => {
    if (searchTriggered && !loading) {
      if (datos.length === 0) setOpenNoDataDialog(true);
      setSearchTriggered(false);
    }
  }, [searchTriggered, loading, datos]);

  const handleBuscar = () => {
    if (poder === "" || !isYearValid || !isMesValid) return;

    dispatch(
      loadNominaResumidaPorPoder({
        year: parseInt(year, 10),
        mes: parseInt(mes, 10),
        poder, // ya es PoderNombreLargo
      })
    );
    setSearchTriggered(true);
  };

  // ⛔ Oculta TODO el bloque del acordeón "Poder del Estado" para usuarios Institucional
  if (userType === "Institucional") {
    return null;
  }

  return (
    <>
      <Accordion
        expanded={expanded}
        onChange={(_, isExp) => onToggle(isExp)}
        sx={{ backgroundColor: "#f5f5f5" }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: "#fff" }} />}
          sx={{ backgroundColor: "#003876", color: "#fff", borderRadius: 2 }}
        >
          <Typography variant="h5">Poder del Estado</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {error && (
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
          )}

          <Box display="flex" flexDirection="column" gap={2} mb={2}>
            <FormControl size="small" sx={{ width: 300 }}>
              <InputLabel>Poder del Estado</InputLabel>
              <Select
                value={poder}
                label="Poder del Estado"
                onChange={(e) => setPoder(e.target.value as PoderNombreLargo)}
              >
                {/* Valores en nombre largo, exactamente como llegan al backend */}
                <MenuItem value="PODER EJECUTIVO">PODER EJECUTIVO</MenuItem>
                <MenuItem value="PODER LEGISLATIVO">PODER LEGISLATIVO</MenuItem>
                <MenuItem value="PODER JUDICIAL">PODER JUDICIAL</MenuItem>
                <MenuItem value="GOBIERNO LOCAL">GOBIERNO LOCAL</MenuItem>
                <MenuItem value="ORGANISMO AUTONOMO">
                  ORGANISMO AUTONOMO
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Año"
              variant="outlined"
              size="small"
              value={year}
              disabled={poder === ""}
              error={!isYearValid && year !== ""}
              onChange={(e) =>
                setYear(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              inputProps={{ maxLength: 4 }}
              sx={{ width: 300 }}
            />

            <TextField
              label="Mes"
              variant="outlined"
              size="small"
              value={mes}
              disabled={!isYearValid}
              error={!isMesValid && mes !== ""}
              onChange={(e) =>
                setMes(e.target.value.replace(/\D/g, "").slice(0, 2))
              }
              inputProps={{ maxLength: 2 }}
              sx={{ width: 300 }}
            />

            <Button
              variant="contained"
              onClick={handleBuscar}
              disabled={isBuscarDisabled}
              sx={{ ...BTN_STYLE, width: 180 }}
            >
              {loading ? "Cargando..." : "Buscar"}
            </Button>
          </Box>

          <PoderNominaResumidaDownloadButton
            datos={datos}
            disabled={datos.length === 0}
            year={parseInt(year || "0", 10) || 0}
            mes={parseInt(mes || "0", 10) || 0}
            poder={poder || ""} // el botón acepta string; si vacío, pasa ""
          />
        </AccordionDetails>
      </Accordion>

      {/* Diálogo: Sin datos */}
      <Dialog
        open={openNoDataDialog}
        onClose={() => setOpenNoDataDialog(false)}
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
            onClick={() => setOpenNoDataDialog(false)}
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

export default PoderNominaResumidaPanel;
