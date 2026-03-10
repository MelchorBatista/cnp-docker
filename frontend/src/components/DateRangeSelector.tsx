/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/components/DateRangeSelector.tsx

import React, { useState } from "react";
import { DateRange } from "react-date-range";
import { addDays } from "date-fns";

// Definir estilos globales y de react-date-range usando CSS inline
const globalStyles = `
  :root {
    --color-blanco: #FFFFFF;
    --color-negro: #000000;
    --color-rojo: #EE2A24;
    --color-azul-oscuro: #003876;
    --color-gris-claro: #F4F4F4;
    --color-gris-oscuro: #808080;
    --color-azul-cielo: #00AADC;
    --color-verde-oliva: #AFCD6E;
    --color-verde-primaveral: #91BE1E;
    --color-verde-tropical: #739619;
    font-family: 'Roboto', sans-serif;
  }
  
  /* Estilos básicos para el componente react-date-range */
  .rdrDateRangeWrapper {
    background-color: var(--color-blanco);
    font-family: 'Roboto', sans-serif;
  }
  
  .rdrCalendarWrapper {
    border: 1px solid var(--color-gris-oscuro);
  }
  
  /* Ocultamos las secciones no necesarias y personalizamos algunos colores */
  .rdrDefinedRangesWrapper {
    display: none;
  }
  
  .rdrDayNumber span {
    color: var(--color-negro);
  }
  
  .rdrInRange .rdrDayNumber span, 
  .rdrDayStart .rdrDayNumber span, 
  .rdrDayEnd .rdrDayNumber span {
    color: var(--color-blanco);
  }
  
  .rdrInRange, 
  .rdrDayStart, 
  .rdrDayEnd {
    background-color: var(--color-azul-oscuro);
  }
`;

interface DateRangeSelectorProps {
  value: [Date | null, Date | null];
  onChange: (range: [Date | null, Date | null]) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
}) => {
  // Inicializamos el rango usando el valor recibido o valores por defecto
  const initialRange = [
    {
      startDate: value[0] || new Date(),
      endDate: value[1] || addDays(new Date(), 7),
      key: "selection",
    },
  ];
  const [range, setRange] = useState(initialRange);

  const handleSelect = (ranges: any) => {
    const selection = ranges.selection;
    setRange([selection]);
    onChange([selection.startDate, selection.endDate]);
  };

  return (
    <>
      <style>{globalStyles}</style>
      <DateRange
        editableDateInputs={true}
        onChange={handleSelect}
        moveRangeOnFirstSelection={false}
        ranges={range}
      />
    </>
  );
};

export default DateRangeSelector;
