/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// frontend/src/components/reporteNomina/PoderNominaResumidaDownloadButton.tsx
import React from "react";
import { Button } from "@mui/material";
import apiClient from "../../services/apiClient";
import { NominaResumidaPoderDTO } from "../../slices/nominaResumidaPoderSlice";

interface Props {
  datos: NominaResumidaPoderDTO[];
  disabled: boolean;
  year: number;
  mes: number;
  poder: string;
}

const BTN_STYLE = {
  backgroundColor: "#003876",
  color: "#fff",
  "&:hover": { backgroundColor: "#002b5a" },
};

const PoderNominaResumidaDownloadButton: React.FC<Props> = ({
  datos,
  disabled,
  year,
  mes,
  poder,
}) => {
  const handleDownload = async () => {
    try {
      const url = `/nomina-resumida-poder/pdf/${year}/${mes}?poder=${encodeURIComponent(
        poder
      )}`;
      const response = await apiClient.get<Blob>(url, { responseType: "blob" });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `NominaResumida_Poder_${poder}_${year}_${String(
        mes
      ).padStart(2, "0")}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Error al descargar PDF resumido por poder", err);
    }
  };

  return (
    <Button
      variant="contained"
      onClick={handleDownload}
      disabled={disabled || datos.length === 0}
      sx={{ ...BTN_STYLE, width: 220 }}
    >
      Descargar PDF
    </Button>
  );
};

export default PoderNominaResumidaDownloadButton;
