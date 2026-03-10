/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// ConfirmacionCorreo.tsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const ConfirmacionCorreo: React.FC = () => {
  const navigate = useNavigate();

  const handleAceptar = (): void => {
    navigate("/");
  };

  // Mensaje fijo que podrás editar posteriormente según necesites
  const mensaje =
    "Su correo ha sido confirmado exitosamente. Un representante se comunicará con usted para confirmar sus datos.";

  return (
    <Dialog
      open={true}
      onClose={handleAceptar}
      aria-labelledby="confirmacion-correo-dialog-title"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="confirmacion-correo-dialog-title">
        CONFIRMACIÓN DE CORREO
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">{mensaje}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleAceptar} variant="contained" color="primary">
          ACEPTAR
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmacionCorreo;
