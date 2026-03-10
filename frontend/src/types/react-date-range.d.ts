/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/react-date-range.d.ts

declare module "react-date-range" {
  import * as React from "react";

  export interface DateRangeProps {
    ranges: Array<{
      startDate: Date;
      endDate: Date;
      key: string;
    }>;
    onChange: (ranges: any) => void;
    editableDateInputs?: boolean;
    moveRangeOnFirstSelection?: boolean;
    // Agrega más propiedades según lo necesites...
  }

  export const DateRange: React.FC<DateRangeProps>;
}
