/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// frontend/src/components/reporteNomina/ReporteNominaOrganismoSelector.tsx
import React from "react";
import { Autocomplete, TextField } from "@mui/material";
import { Organismo } from "../../services/ReporteNominaService";

interface Props {
  organismos: Organismo[];
  value: number | null;
  onChange: (id: number | null) => void;
}

/**
 * Selector de Organismo:
 * - Muestra el nombre en el desplegable
 * - Retorna el Código (CodigoOrganismoMAP)
 */
const ReporteNominaOrganismoSelector: React.FC<Props> = ({
  organismos,
  value,
  onChange,
}) => {
  const selected = organismos.find((o) => o.Codigo === value) || null;

  return (
    <Autocomplete<Organismo>
      options={organismos}
      getOptionLabel={(option) => option.Nombre}
      value={selected}
      onChange={(_, newVal) => onChange(newVal ? newVal.Codigo : null)}
      isOptionEqualToValue={(opt, val) => opt.Codigo === val?.Codigo}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Organismo"
          variant="outlined"
          size="small"
        />
      )}
      sx={{ width: 300 }}
    />
  );
};

export default ReporteNominaOrganismoSelector;
