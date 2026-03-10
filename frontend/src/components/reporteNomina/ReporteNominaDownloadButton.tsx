/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// frontend/src/components/reporteNomina/ReporteNominaDownloadButton.tsx
import React, { useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import { downloadReporteNominaPdf } from "../../services/ReporteNominaService";

interface Props {
  datos: any[];
  disabled: boolean;
  organismoId: number;
  year: number;
  mes: number;
}

const BTN_STYLE = {
  backgroundColor: "#003876",
  color: "#fff",
  "&:hover": { backgroundColor: "#002b5a" },
};

const ReporteNominaDownloadButton: React.FC<Props> = ({
  datos,
  disabled,
  organismoId,
  year,
  mes,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = await downloadReporteNominaPdf({ organismoId, year, mes });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ReporteNomina_${year}_${mes
        .toString()
        .padStart(2, "0")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="contained"
      onClick={handleDownload}
      disabled={disabled || loading || datos.length === 0}
      startIcon={loading ? <CircularProgress size={20} /> : undefined}
      sx={{ ...BTN_STYLE, width: 180, textAlign: "center" }}
    >
      {loading ? "Descargando..." : "Descargar PDF"}
    </Button>
  );
};

export default ReporteNominaDownloadButton;
