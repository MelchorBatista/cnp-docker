/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// frontend/src/components/reporteNomina/NominaResumidaDownloadButton.tsx
import React from "react";
import { Button } from "@mui/material";
import apiClient from "../../services/apiClient";
import { NominaResumidaDTO } from "../../slices/nominaResumidaSlice";

interface Props {
  datos: NominaResumidaDTO[];
  disabled: boolean;
  year: number;
  mes: number;
  /** Filtros opcionales para que el PDF refleje exactamente lo consultado */
  organismoId?: number;
  poder?: string;
}

const NominaResumidaDownloadButton: React.FC<Props> = ({
  datos,
  disabled,
  year,
  mes,
  organismoId,
  poder,
}) => {
  const handleDownload = async () => {
    try {
      // Construir querystring opcional con filtros
      const params = new URLSearchParams();
      if (typeof organismoId === "number") {
        params.append("organismoId", String(organismoId));
      }
      if (poder && poder.trim() !== "") {
        params.append("poder", poder.trim());
      }
      const qs = params.toString();
      const url = qs
        ? `/nomina-resumida/pdf/${year}/${mes}?${qs}`
        : `/nomina-resumida/pdf/${year}/${mes}`;

      const response = await apiClient.get<Blob>(url, { responseType: "blob" });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `NominaResumida_${year}_${mes
        .toString()
        .padStart(2, "0")}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Error al descargar PDF resumido", err);
    }
  };

  return (
    <Button
      variant="contained"
      onClick={handleDownload}
      disabled={disabled || datos.length === 0}
      sx={{
        backgroundColor: "#003876",
        color: "#fff",
        "&:hover": { backgroundColor: "#002b5a" },
        width: 180,
        textAlign: "center",
      }}
    >
      Descargar PDF
    </Button>
  );
};

export default NominaResumidaDownloadButton;
