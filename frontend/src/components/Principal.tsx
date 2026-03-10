/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/components/Principal.tsx
import React from "react";
import { Container } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedOption } from "../slices/authSlice";
import SubirNominaJSON from "./SubirNominaJSON";

interface PrincipalProps {
  children?: React.ReactNode; // ← permite anidar Estadisticas u otros
}

function Principal({ children }: PrincipalProps) {
  const dispatch = useDispatch();
  const selectedOption = useSelector((state: any) => state.auth.selectedOption);

  const handleMenuItemClick = (item: string) => {
    dispatch(setSelectedOption(item));
  };

  return (
    <Container
      maxWidth={false} // ancho completo
      disableGutters
      sx={{
        pt: 2,
        pb: 0, // deja hueco al Pie
        height: "calc(100vh - 104px)", // 64 AppBar + 40 Pie
        overflow: "auto",
      }}
    >
      {/* Si Principal recibe hijos (Estadisticas) los pinta; si no, usa lógica antigua */}
      {children ? (
        children
      ) : selectedOption === "SubirNomina" ? (
        <SubirNominaJSON open={false} setOpen={() => {}} />
      ) : null}
    </Container>
  );
}

export default Principal;
