/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
import React, { useEffect } from "react";
import { getDerivedKeyHex, logExpectedDerivedKey } from "../utils/cryptoUtils";

const TestClave: React.FC = () => {
  useEffect(() => {
    // Muestra la clave derivada en el frontend
    const frontendKey = getDerivedKeyHex();
    // Muestra la clave "esperada" que debes haber calculado manualmente
    logExpectedDerivedKey();
  }, []);

  return (
    <div
      style={{
        padding: "10px",
        backgroundColor: "#f0f0f0",
        marginBottom: "20px",
      }}
    >
      <strong>Revisa la consola para ver la comparación de claves.</strong>
    </div>
  );
};

export default TestClave;
