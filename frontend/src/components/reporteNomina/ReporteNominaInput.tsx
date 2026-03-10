/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// frontend/src/components/reporteNomina/ReporteNominaInput.tsx
import React from "react";
import { TextField } from "@mui/material";

interface Props {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

/**
 * Input numérico para año o número de nómina
 */
const ReporteNominaNominaInput: React.FC<Props> = ({
  label,
  value,
  onChange,
}) => {
  return (
    <TextField
      label={label}
      variant="outlined"
      size="small"
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ width: 100 }}
      InputProps={{ inputProps: { min: 0 } }}
    />
  );
};

export default ReporteNominaNominaInput;
